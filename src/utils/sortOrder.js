export function getOrderedKeys(keys, savedOrder = []) {
  const currentKeys = [...new Set(keys.map((key) => String(key)))];
  const currentSet = new Set(currentKeys);
  const savedKeys = Array.isArray(savedOrder) ? savedOrder : [];
  const retained = savedKeys
    .map((key) => String(key))
    .filter((key, index, array) => currentSet.has(key) && array.indexOf(key) === index);

  return [...retained, ...currentKeys.filter((key) => !retained.includes(key))];
}

export function orderBySavedKeys(items, getKey, savedOrder = []) {
  const itemByKey = new Map(items.map((item) => [String(getKey(item)), item]));
  const orderedKeys = getOrderedKeys([...itemByKey.keys()], savedOrder);

  return orderedKeys.map((key) => itemByKey.get(key)).filter(Boolean);
}

export function moveOrderItem(savedOrder, currentKeys, key, delta) {
  const orderedKeys = getOrderedKeys(currentKeys, savedOrder);
  const currentIndex = orderedKeys.indexOf(String(key));
  const nextIndex = currentIndex + delta;

  if (currentIndex === -1 || nextIndex < 0 || nextIndex >= orderedKeys.length) {
    return orderedKeys;
  }

  const nextOrder = [...orderedKeys];
  const [movedKey] = nextOrder.splice(currentIndex, 1);
  nextOrder.splice(nextIndex, 0, movedKey);
  return nextOrder;
}

export function reorderOrderItems(savedOrder, currentKeys, sourceKey, targetKey) {
  const orderedKeys = getOrderedKeys(currentKeys, savedOrder);
  const sourceIndex = orderedKeys.indexOf(String(sourceKey));
  const targetIndex = orderedKeys.indexOf(String(targetKey));

  if (sourceIndex === -1 || targetIndex === -1 || sourceIndex === targetIndex) {
    return orderedKeys;
  }

  const nextOrder = [...orderedKeys];
  const [movedKey] = nextOrder.splice(sourceIndex, 1);
  nextOrder.splice(targetIndex, 0, movedKey);
  return nextOrder;
}
