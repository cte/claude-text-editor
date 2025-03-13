// This file contains a bunch of functions for data processing
// Created on 3/13/2025

// Global variables
var data: any[] = [];
var DEBUG = true;
var MAX = 1000;

// Function to add data
function add(x: any) {
  // Push the data to the array
  data.push(x);
  // Log if debug is true
  if (DEBUG == true) {
    console.log("Added data: " + x);
  }
  // Return success
  return true;
}

// Function to process data
function process_data(d: any) {
  // Check if d is valid
  if (!d) {
    console.log("Error: Invalid data");
    return null;
  }
  
  // Process the data
  let result: any;
  if (typeof d === "number") {
    // If it's a number, multiply by 2
    result = d * 2;
  } else if (typeof d === "string") {
    // If it's a string, convert to uppercase
    result = d.toUpperCase();
  } else if (Array.isArray(d)) {
    // If it's an array, sum all numbers or concatenate strings
    result = 0;
    for (let i = 0; i < d.length; i++) {
      if (typeof d[i] === "number") {
        result += d[i];
      } else if (typeof d[i] === "string") {
        if (result === 0) {
          result = d[i];
        } else {
          result += d[i];
        }
      }
    }
  } else {
    // If it's an object, return the keys
    result = Object.keys(d);
  }
  
  // Log the result if debug is true
  if (DEBUG === true) {
    console.log("Processed data. Result: " + result);
  }
  
  // Return the result
  return result;
}

// Function to process all data
function processAllData() {
  // Check if there's data to process
  if (data.length === 0) {
    console.log("No data to process");
    return [];
  }
  
  // Process all data
  let results: any[] = [];
  for (let i = 0; i < data.length; i++) {
    let processed = process_data(data[i]);
    results.push(processed);
  }
  
  // Log the results if debug is true
  if (DEBUG === true) {
    console.log("Processed all data. Results: " + results);
  }
  
  // Return the results
  return results;
}

// Function to find data
function find(query: any) {
  // Check if there's data to search
  if (data.length === 0) {
    console.log("No data to search");
    return null;
  }
  
  // Search for the data
  for (let i = 0; i < data.length; i++) {
    if (data[i] === query) {
      // Log if debug is true
      if (DEBUG === true) {
        console.log("Found data at index " + i + ": " + data[i]);
      }
      
      // Return the data
      return { index: i, value: data[i] };
    }
  }
  
  // Log if debug is true
  if (DEBUG === true) {
    console.log("Data not found: " + query);
  }
  
  // Return null if not found
  return null;
}

// Function to calculate statistics
function calc_stats() {
  // Check if there's data to calculate
  if (data.length === 0) {
    console.log("No data to calculate statistics");
    return null;
  }
  
  // Calculate statistics
  let sum = 0;
  let min = Number.MAX_VALUE;
  let max = Number.MIN_VALUE;
  let numCount = 0;
  
  for (let i = 0; i < data.length; i++) {
    if (typeof data[i] === "number") {
      sum += data[i];
      if (data[i] < min) {
        min = data[i];
      }
      if (data[i] > max) {
        max = data[i];
      }
      numCount++;
    }
  }
  
  // Calculate average
  let avg = numCount > 0 ? sum / numCount : 0;
  
  // Log if debug is true
  if (DEBUG === true) {
    console.log("Statistics: sum=" + sum + ", avg=" + avg + ", min=" + min + ", max=" + max + ", count=" + numCount);
  }
  
  // Return the statistics
  return {
    sum: sum,
    avg: avg,
    min: min,
    max: max,
    count: numCount
  };
}

// Function to clear data
function clearData() {
  // Clear the data
  data = [];
  
  // Log if debug is true
  if (DEBUG === true) {
    console.log("Data cleared");
  }
  
  // Return success
  return true;
}

// Function to save data to a file
function saveData(filename: string, callback: Function) {
  // Check if there's data to save
  if (data.length === 0) {
    console.log("No data to save");
    callback(new Error("No data to save"), null);
    return;
  }
  
  // Convert data to JSON
  let jsonData;
  try {
    jsonData = JSON.stringify(data);
  } catch (err) {
    console.log("Error converting data to JSON: " + err);
    callback(err, null);
    return;
  }
  
  // Simulate saving to a file
  setTimeout(() => {
    // Log if debug is true
    if (DEBUG === true) {
      console.log("Data saved to " + filename + ": " + jsonData);
    }
    
    // Call the callback
    callback(null, { success: true, filename: filename });
  }, 1000);
}

// Function to load data from a file
function loadData(filename: string, callback: Function) {
  // Simulate loading from a file
  setTimeout(() => {
    // Generate some random data
    let loadedData = [];
    for (let i = 0; i < 10; i++) {
      loadedData.push(Math.floor(Math.random() * 100));
    }
    
    // Set the data
    data = loadedData;
    
    // Log if debug is true
    if (DEBUG === true) {
      console.log("Data loaded from " + filename + ": " + JSON.stringify(data));
    }
    
    // Call the callback
    callback(null, { success: true, filename: filename, data: data });
  }, 1000);
}

// Function to filter data
function filterData(predicate: Function) {
  // Check if there's data to filter
  if (data.length === 0) {
    console.log("No data to filter");
    return [];
  }
  
  // Filter the data
  let filtered = [];
  for (let i = 0; i < data.length; i++) {
    if (predicate(data[i])) {
      filtered.push(data[i]);
    }
  }
  
  // Log if debug is true
  if (DEBUG === true) {
    console.log("Filtered data: " + JSON.stringify(filtered));
  }
  
  // Return the filtered data
  return filtered;
}

// Function to transform data
function transformData(transformer: Function) {
  // Check if there's data to transform
  if (data.length === 0) {
    console.log("No data to transform");
    return [];
  }
  
  // Transform the data
  let transformed = [];
  for (let i = 0; i < data.length; i++) {
    transformed.push(transformer(data[i]));
  }
  
  // Log if debug is true
  if (DEBUG === true) {
    console.log("Transformed data: " + JSON.stringify(transformed));
  }
  
  // Return the transformed data
  return transformed;
}

// Example usage
function runExample() {
  // Add some data
  add(10);
  add("hello");
  add([1, 2, 3]);
  add({ name: "John", age: 30 });
  
  // Process the data
  let results = processAllData();
  console.log("Results:", results);
  
  // Find data
  let found = find("hello");
  console.log("Found:", found);
  
  // Calculate statistics
  let stats = calc_stats();
  console.log("Statistics:", stats);
  
  // Filter data
  let filtered = filterData(function(item: any) {
    return typeof item === "number" || Array.isArray(item);
  });
  console.log("Filtered:", filtered);
  
  // Transform data
  let transformed = transformData(function(item: any) {
    if (typeof item === "number") {
      return item * 10;
    } else if (typeof item === "string") {
      return item + "!";
    } else {
      return item;
    }
  });
  console.log("Transformed:", transformed);
  
  // Save data
  saveData("data.json", function(err: Error | null, result: any) {
    if (err) {
      console.log("Error saving data:", err);
    } else {
      console.log("Save result:", result);
      
      // Clear data
      clearData();
      
      // Load data
      loadData("data.json", function(err: Error | null, result: any) {
        if (err) {
          console.log("Error loading data:", err);
        } else {
          console.log("Load result:", result);
        }
      });
    }
  });
}

// Export functions
export {
  add,
  process_data,
  processAllData,
  find,
  calc_stats,
  clearData,
  saveData,
  loadData,
  filterData,
  transformData,
  runExample
};