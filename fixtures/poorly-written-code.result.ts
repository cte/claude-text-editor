/**
 * Data Processing Utilities
 * 
 * A collection of functions for managing and processing data.
 * Created on 3/13/2025
 */

// Configuration
const CONFIG = {
  DEBUG: true,
  MAX_ITEMS: 1000
};

// Store data in a private variable
let dataStore: any[] = [];

/**
 * Adds an item to the data store
 * @param item - Any item to add to the data store
 * @returns boolean indicating success
 */
function add(item: any): boolean {
  dataStore.push(item);
  
  if (CONFIG.DEBUG) {
    console.log(`Added data: ${JSON.stringify(item)}`);
  }
  
  return true;
}

/**
 * Processes a data item based on its type
 * - Numbers: multiplied by 2
 * - Strings: converted to uppercase
 * - Arrays: numbers are summed, strings are concatenated
 * - Objects: keys are returned
 * 
 * @param data - The data to process
 * @returns The processed data or null if invalid
 */
function processData(data: any): any {
  if (!data) {
    console.log("Error: Invalid data");
    return null;
  }
  
  let result: any;
  
  switch (typeof data) {
    case "number":
      result = data * 2;
      break;
      
    case "string":
      result = data.toUpperCase();
      break;
      
    default:
      if (Array.isArray(data)) {
        result = processArray(data);
      } else if (typeof data === "object") {
        result = Object.keys(data);
      }
  }
  
  if (CONFIG.DEBUG) {
    console.log(`Processed data. Result: ${result}`);
  }
  
  return result;
}

/**
 * Helper function to process array elements
 * @param arr - Array to process
 */
function processArray(arr: any[]): any {
  let result: any = 0;
  
  for (const item of arr) {
    if (typeof item === "number") {
      result += item;
    } else if (typeof item === "string") {
      if (result === 0) {
        result = item;
      } else {
        result += item;
      }
    }
  }
  
  return result;
}

/**
 * Process all items in the data store
 * @returns Array of processed items
 */
function processAllData(): any[] {
  if (dataStore.length === 0) {
    console.log("No data to process");
    return [];
  }
  
  const results = dataStore.map(item => processData(item));
  
  if (CONFIG.DEBUG) {
    console.log(`Processed all data. Results: ${JSON.stringify(results)}`);
  }
  
  return results;
}

/**
 * Find an item in the data store
 * @param query - The item to find
 * @returns Object with index and value if found, null otherwise
 */
function find(query: any): { index: number, value: any } | null {
  if (dataStore.length === 0) {
    console.log("No data to search");
    return null;
  }
  
  const index = dataStore.findIndex(item => item === query);
  
  if (index !== -1) {
    if (CONFIG.DEBUG) {
      console.log(`Found data at index ${index}: ${JSON.stringify(dataStore[index])}`);
    }
    
    return { index, value: dataStore[index] };
  }
  
  if (CONFIG.DEBUG) {
    console.log(`Data not found: ${JSON.stringify(query)}`);
  }
  
  return null;
}

/**
 * Calculate statistics for numeric values in the data store
 * @returns Statistics object or null if no data
 */
interface Statistics {
  sum: number;
  avg: number;
  min: number;
  max: number;
  count: number;
}

function calculateStats(): Statistics | null {
  if (dataStore.length === 0) {
    console.log("No data to calculate statistics");
    return null;
  }
  
  const numberItems = dataStore.filter(item => typeof item === "number") as number[];
  
  if (numberItems.length === 0) {
    return {
      sum: 0,
      avg: 0,
      min: 0,
      max: 0,
      count: 0
    };
  }
  
  const sum = numberItems.reduce((acc, val) => acc + val, 0);
  const min = Math.min(...numberItems);
  const max = Math.max(...numberItems);
  const count = numberItems.length;
  const avg = sum / count;
  
  if (CONFIG.DEBUG) {
    console.log(`Statistics: sum=${sum}, avg=${avg}, min=${min}, max=${max}, count=${count}`);
  }
  
  return { sum, avg, min, max, count };
}

/**
 * Clear all data from the data store
 * @returns boolean indicating success
 */
function clearData(): boolean {
  dataStore = [];
  
  if (CONFIG.DEBUG) {
    console.log("Data cleared");
  }
  
  return true;
}

/**
 * Save data to a file (simulated)
 * @param filename - Name of the file to save to
 * @param callback - Function to call when save is complete
 */
type SaveCallback = (error: Error | null, result?: { success: boolean, filename: string }) => void;

function saveData(filename: string, callback: SaveCallback): void {
  if (dataStore.length === 0) {
    console.log("No data to save");
    callback(new Error("No data to save"));
    return;
  }
  
  let jsonData: string;
  try {
    jsonData = JSON.stringify(dataStore);
  } catch (err) {
    const error = err instanceof Error ? err : new Error(String(err));
    console.log(`Error converting data to JSON: ${error.message}`);
    callback(error);
    return;
  }
  
  // Simulate saving to a file
  setTimeout(() => {
    if (CONFIG.DEBUG) {
      console.log(`Data saved to ${filename}: ${jsonData}`);
    }
    
    callback(null, { success: true, filename });
  }, 1000);
}

/**
 * Load data from a file (simulated)
 * @param filename - Name of the file to load from
 * @param callback - Function to call when load is complete
 */
type LoadCallback = (
  error: Error | null, 
  result?: { success: boolean, filename: string, data: any[] }
) => void;

function loadData(filename: string, callback: LoadCallback): void {
  // Simulate loading from a file
  setTimeout(() => {
    // Generate some random data
    const loadedData = Array.from({ length: 10 }, () => Math.floor(Math.random() * 100));
    
    // Set the data
    dataStore = loadedData;
    
    if (CONFIG.DEBUG) {
      console.log(`Data loaded from ${filename}: ${JSON.stringify(dataStore)}`);
    }
    
    callback(null, { 
      success: true, 
      filename, 
      data: dataStore 
    });
  }, 1000);
}

/**
 * Filter data in the data store
 * @param predicate - Function that returns true for items to keep
 * @returns Filtered array of items
 */
function filterData(predicate: (item: any) => boolean): any[] {
  if (dataStore.length === 0) {
    console.log("No data to filter");
    return [];
  }
  
  const filtered = dataStore.filter(predicate);
  
  if (CONFIG.DEBUG) {
    console.log(`Filtered data: ${JSON.stringify(filtered)}`);
  }
  
  return filtered;
}

/**
 * Transform data in the data store
 * @param transformer - Function that transforms each item
 * @returns Array of transformed items
 */
function transformData<T>(transformer: (item: any) => T): T[] {
  if (dataStore.length === 0) {
    console.log("No data to transform");
    return [];
  }
  
  const transformed = dataStore.map(transformer);
  
  if (CONFIG.DEBUG) {
    console.log(`Transformed data: ${JSON.stringify(transformed)}`);
  }
  
  return transformed;
}

/**
 * Run an example demonstrating all functionality
 */
function runExample(): void {
  // Add some sample data
  add(10);
  add("hello");
  add([1, 2, 3]);
  add({ name: "John", age: 30 });
  
  // Process all data
  const results = processAllData();
  console.log("Results:", results);
  
  // Find an item
  const found = find("hello");
  console.log("Found:", found);
  
  // Calculate statistics
  const stats = calculateStats();
  console.log("Statistics:", stats);
  
  // Filter data
  const filtered = filterData(item => 
    typeof item === "number" || Array.isArray(item)
  );
  console.log("Filtered:", filtered);
  
  // Transform data
  const transformed = transformData((item: any) => {
    if (typeof item === "number") {
      return item * 10;
    } else if (typeof item === "string") {
      return item + "!";
    } else {
      return item;
    }
  });
  console.log("Transformed:", transformed);
  
  // Demonstrate async operations
  saveData("data.json", (err, result) => {
    if (err) {
      console.log("Error saving data:", err);
    } else {
      console.log("Save result:", result);
      
      clearData();
      
      loadData("data.json", (err, result) => {
        if (err) {
          console.log("Error loading data:", err);
        } else {
          console.log("Load result:", result);
        }
      });
    }
  });
}

// Export public API
export {
  add,
  processData,
  processAllData,
  find,
  calculateStats,
  clearData,
  saveData,
  loadData,
  filterData,
  transformData,
  runExample,
  // Types
  Statistics,
  SaveCallback,
  LoadCallback
};