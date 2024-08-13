// Copyright 2024 Google LLC

// Licensed under the Apache License, Version 2.0 (the "License");
// you may not use this file except in compliance with the License.
// You may obtain a copy of the License at

//     http://www.apache.org/licenses/LICENSE-2.0

// Unless required by applicable law or agreed to in writing, software
// distributed under the License is distributed on an "AS IS" BASIS,
// WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
// See the License for the specific language governing permissions and
// limitations under the License.


const sendRequestToApi = async (
    apiUrl,
    payload,
    contentType = "application/json",
    method = "POST"
  ) => {
    try {
      const response = await fetch(apiUrl, {
        method: method,
        headers: {
          "Content-Type": contentType,
        },
        body: JSON.stringify(payload),
      });
  
      if (!response.ok) {
        const { error, errorMessage, warnings } = await response.json();
        console.warn(warnings);
  
        throw new Error(`Error: ${error} 
          Message: ${errorMessage}`);
      }
  
      const data = await response.json();
      return data;
    } catch (error) {
      throw new Error(error);
    }
  };
  
  export { sendRequestToApi };