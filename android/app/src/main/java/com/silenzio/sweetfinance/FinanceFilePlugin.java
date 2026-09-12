package com.silenzio.sweetfinance;

import android.app.Activity;
import android.content.Intent;
import android.database.Cursor;
import android.database.sqlite.SQLiteDatabase;
import android.database.sqlite.SQLiteException;
import android.net.Uri;
import android.provider.OpenableColumns;
import androidx.activity.result.ActivityResult;
import com.getcapacitor.JSObject;
import com.getcapacitor.Plugin;
import com.getcapacitor.PluginCall;
import com.getcapacitor.PluginMethod;
import com.getcapacitor.annotation.ActivityCallback;
import com.getcapacitor.annotation.CapacitorPlugin;
import java.io.ByteArrayOutputStream;
import java.io.File;
import java.io.FileInputStream;
import java.io.FileOutputStream;
import java.io.IOException;
import java.io.InputStream;
import java.io.OutputStream;
import java.nio.charset.StandardCharsets;

@CapacitorPlugin(name = "FinanceFile")
public class FinanceFilePlugin extends Plugin {
    private static final int MAX_BACKUP_BYTES = 10 * 1024 * 1024;

    @PluginMethod
    public void exportJson(PluginCall call) {
        String content = call.getString("content");
        if (content == null) {
            call.reject("content must be provided.");
            return;
        }

        Intent intent = new Intent(Intent.ACTION_CREATE_DOCUMENT);
        intent.addCategory(Intent.CATEGORY_OPENABLE);
        intent.setType("application/json");
        intent.putExtra(Intent.EXTRA_TITLE, call.getString("filename", "SweetFinance_Backup.json"));
        startActivityForResult(call, intent, "exportJsonResult");
    }

    @PluginMethod
    public void exportDatabase(PluginCall call) {
        Intent intent = new Intent(Intent.ACTION_CREATE_DOCUMENT);
        intent.addCategory(Intent.CATEGORY_OPENABLE);
        intent.setType("application/vnd.sqlite3");
        intent.putExtra(Intent.EXTRA_TITLE, call.getString("filename", "SweetFinance_Database.db"));
        startActivityForResult(call, intent, "exportDatabaseResult");
    }

    @PluginMethod
    public void importJson(PluginCall call) {
        Intent intent = new Intent(Intent.ACTION_OPEN_DOCUMENT);
        intent.addCategory(Intent.CATEGORY_OPENABLE);
        intent.addFlags(Intent.FLAG_GRANT_READ_URI_PERMISSION);
        intent.setType("*/*");
        intent.putExtra(Intent.EXTRA_MIME_TYPES, new String[] {
            "application/json",
            "text/json",
            "text/plain"
        });
        startActivityForResult(call, intent, "importJsonResult");
    }

    @ActivityCallback
    private void exportJsonResult(PluginCall call, ActivityResult result) {
        if (call == null) return;

        if (result.getResultCode() == Activity.RESULT_CANCELED) {
            resolveCancelled(call);
            return;
        }

        try {
            Uri uri = result.getData() == null ? null : result.getData().getData();
            if (result.getResultCode() != Activity.RESULT_OK || uri == null) {
                call.reject("无法保存备份文件。");
                return;
            }

            String content = call.getString("content");
            if (content == null) {
                call.reject("备份内容为空。");
                return;
            }

            try (OutputStream stream = getContext().getContentResolver().openOutputStream(uri)) {
                if (stream == null) throw new IOException("无法打开目标文件。");
                stream.write(content.getBytes(StandardCharsets.UTF_8));
            }

            JSObject response = new JSObject();
            response.put("cancelled", false);
            response.put("filename", getDisplayName(uri));
            call.resolve(response);
        } catch (Exception error) {
            call.reject("保存备份文件失败：" + error.getMessage(), error);
        }
    }

    @ActivityCallback
    private void exportDatabaseResult(PluginCall call, ActivityResult result) {
        if (call == null) return;

        if (result.getResultCode() == Activity.RESULT_CANCELED) {
            resolveCancelled(call);
            return;
        }

        File snapshot = null;
        try {
            Uri uri = result.getData() == null ? null : result.getData().getData();
            if (result.getResultCode() != Activity.RESULT_OK || uri == null) {
                call.reject("无法保存数据库副本。");
                return;
            }

            snapshot = createDatabaseSnapshot();
            try (
                InputStream input = new FileInputStream(snapshot);
                OutputStream output = getContext().getContentResolver().openOutputStream(uri)
            ) {
                if (output == null) throw new IOException("无法打开目标文件。");
                copyStream(input, output);
            }

            JSObject response = new JSObject();
            response.put("cancelled", false);
            response.put("filename", getDisplayName(uri));
            response.put("size", snapshot.length());
            call.resolve(response);
        } catch (Exception error) {
            call.reject("保存 SQLite 数据库副本失败：" + error.getMessage(), error);
        } finally {
            if (snapshot != null && snapshot.exists() && !snapshot.delete()) {
                snapshot.deleteOnExit();
            }
        }
    }

    @ActivityCallback
    private void importJsonResult(PluginCall call, ActivityResult result) {
        if (call == null) return;

        if (result.getResultCode() == Activity.RESULT_CANCELED) {
            resolveCancelled(call);
            return;
        }

        try {
            Uri uri = result.getData() == null ? null : result.getData().getData();
            if (result.getResultCode() != Activity.RESULT_OK || uri == null) {
                call.reject("无法读取备份文件。");
                return;
            }

            JSObject response = new JSObject();
            response.put("cancelled", false);
            response.put("filename", getDisplayName(uri));
            response.put("content", readText(uri));
            call.resolve(response);
        } catch (Exception error) {
            call.reject("读取备份文件失败：" + error.getMessage(), error);
        }
    }

    private void resolveCancelled(PluginCall call) {
        JSObject response = new JSObject();
        response.put("cancelled", true);
        call.resolve(response);
    }

    private String readText(Uri uri) throws IOException {
        try (InputStream input = getContext().getContentResolver().openInputStream(uri);
             ByteArrayOutputStream output = new ByteArrayOutputStream()) {
            if (input == null) throw new IOException("无法打开备份文件。");

            byte[] buffer = new byte[8192];
            int totalBytes = 0;
            int count;
            while ((count = input.read(buffer)) != -1) {
                totalBytes += count;
                if (totalBytes > MAX_BACKUP_BYTES) {
                    throw new IOException("备份文件超过 10 MB，无法导入。");
                }
                output.write(buffer, 0, count);
            }
            return output.toString(StandardCharsets.UTF_8.name());
        }
    }

    private File createDatabaseSnapshot() throws Exception {
        File source = getContext().getDatabasePath("sweetfinanceSQLite.db");
        if (!source.isFile()) {
            throw new IOException("尚未找到 SweetFinance 的 SQLite 数据库。");
        }

        File snapshot = File.createTempFile("sweetfinance-database-", ".db", getContext().getCacheDir());
        if (!snapshot.delete()) {
            throw new IOException("无法准备数据库快照文件。");
        }

        SQLiteDatabase database = null;
        try {
            database = SQLiteDatabase.openDatabase(source.getAbsolutePath(), null, SQLiteDatabase.OPEN_READWRITE);
            try {
                database.execSQL("VACUUM INTO " + quoteSqlLiteral(snapshot.getAbsolutePath()));
            } catch (SQLiteException error) {
                if (!isVacuumIntoUnsupported(error)) throw error;
                checkpointDatabase(database);
                copyFile(source, snapshot);
            }
            return snapshot;
        } catch (Exception error) {
            if (snapshot.exists() && !snapshot.delete()) snapshot.deleteOnExit();
            throw error;
        } finally {
            if (database != null) database.close();
        }
    }

    private void checkpointDatabase(SQLiteDatabase database) throws IOException {
        try (Cursor cursor = database.rawQuery("PRAGMA wal_checkpoint(FULL)", null)) {
            if (!cursor.moveToFirst()) return;

            int busy = cursor.getInt(0);
            int framesInLog = cursor.getInt(1);
            int framesCheckpointed = cursor.getInt(2);
            if (busy != 0 || (framesInLog >= 0 && framesCheckpointed >= 0 && framesInLog != framesCheckpointed)) {
                throw new IOException("数据库正在写入，请稍后重试导出。");
            }
        } catch (SQLiteException error) {
            throw new IOException("无法确认 SQLite 日志状态。", error);
        }
    }

    private boolean isVacuumIntoUnsupported(SQLiteException error) {
        String message = error.getMessage();
        if (message == null) return false;
        String lowerMessage = message.toLowerCase();
        return lowerMessage.contains("near \"into\"")
            || lowerMessage.contains("unrecognized token")
            || lowerMessage.contains("syntax error");
    }

    private String quoteSqlLiteral(String value) {
        return "'" + value.replace("'", "''") + "'";
    }

    private void copyFile(File source, File target) throws IOException {
        try (InputStream input = new FileInputStream(source); OutputStream output = new FileOutputStream(target)) {
            copyStream(input, output);
        }
    }

    private void copyStream(InputStream input, OutputStream output) throws IOException {
        byte[] buffer = new byte[8192];
        int count;
        while ((count = input.read(buffer)) != -1) {
            output.write(buffer, 0, count);
        }
    }

    private String getDisplayName(Uri uri) {
        try (Cursor cursor = getContext().getContentResolver().query(
            uri,
            new String[] { OpenableColumns.DISPLAY_NAME },
            null,
            null,
            null
        )) {
            if (cursor != null && cursor.moveToFirst()) {
                int index = cursor.getColumnIndex(OpenableColumns.DISPLAY_NAME);
                if (index >= 0) return cursor.getString(index);
            }
        }
        return uri.getLastPathSegment() == null ? "SweetFinance_Backup.json" : uri.getLastPathSegment();
    }
}
