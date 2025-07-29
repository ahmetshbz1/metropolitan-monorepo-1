//  "redis-stock-scripts.ts"
//  metropolitan backend
//  Redis Lua Scripts for atomic stock operations

/**
 * Redis Lua Scripts for atomic stock operations
 * Ensures true atomicity even under high concurrency
 */
export const REDIS_STOCK_SCRIPTS = {
  // Atomic reserve with availability check
  atomicReserve: `
    local stockKey = KEYS[1]
    local quantity = tonumber(ARGV[1])
    local currentStock = tonumber(redis.call('GET', stockKey) or 0)

    if currentStock >= quantity then
      local newStock = redis.call('DECRBY', stockKey, quantity)
      return {1, newStock}
    else
      return {0, currentStock}
    end
  `,

  // Atomic rollback
  atomicRollback: `
    local stockKey = KEYS[1]
    local quantity = tonumber(ARGV[1])
    local newStock = redis.call('INCRBY', stockKey, quantity)
    return newStock
  `,

  // Atomic multi-product reserve
  atomicMultiReserve: `
    local products = {}
    local totalKeys = #KEYS
    
    -- Check all products first
    for i = 1, totalKeys do
      local stockKey = KEYS[i]
      local quantity = tonumber(ARGV[i])
      local currentStock = tonumber(redis.call('GET', stockKey) or 0)
      
      if currentStock < quantity then
        return {0, i, currentStock, quantity} -- failure: key index, current, requested
      end
      
      products[i] = {stockKey, quantity, currentStock}
    end
    
    -- If all checks pass, reserve all products
    local results = {}
    for i = 1, totalKeys do
      local stockKey = products[i][1]
      local quantity = products[i][2]
      local newStock = redis.call('DECRBY', stockKey, quantity)
      results[i] = newStock
    end
    
    return {1, results} -- success with new stock levels
  `,
};