<?php

try {
    $redis = new Redis();
    $redis->connect('127.0.0.1', 6379);
    
    echo "✅ Redis connected!\n";
    echo "Ping: " . $redis->ping() . "\n";
    
    $redis->set('test_key', 'Hello Redis!');
    echo "Test value: " . $redis->get('test_key') . "\n";
    
    // List all keys
    echo "All keys:\n";
    print_r($redis->keys('*'));
    
} catch (Exception $e) {
    echo "❌ Error: " . $e->getMessage() . "\n";
}
