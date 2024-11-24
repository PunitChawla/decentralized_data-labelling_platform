// Function to handle file upload
async function uploadFile(file) {
    // Define your fields and S3 URL (replace these with your actual values)
    const s3Url = 'https://data-labelling-decentralized.s3.us-east-1.amazonaws.com/';
    const formData = new FormData();
  
    // Append all the required fields from the presigned URL to the FormData object
    formData.append('key', 'fiver/1/0.013755383765690077/image.jpg');
    formData.append('bucket', 'data-labelling-decentralized');
    formData.append('X-Amz-Algorithm', 'AWS4-HMAC-SHA256');
    formData.append('X-Amz-Credential', 'AKIAQ3EGUDUH7MTX7KWH/20241025/us-east-1/s3/aws4_request');
    formData.append('X-Amz-Date', '20241025T073853Z');
    formData.append('Policy', 'eyJleHBpcmF0aW9uIjoiMjAyNC0xMC0yNVQwODoyODo1M1oiLCJjb25kaXRpb25zIjpbWyJjb250ZW50LWxlbmd0aC1yYW5nZSIsMCw1MjQyODgwXSx7InN1Y2Nlc19hY3Rpb25fc3RhdHVzIjoiMjAxIn0seyJDb250ZW50LVR5cGUiOiJpbWFnZS9wbmcifSx7ImJ1Y2tldCI6ImRhdGEtbGFiZWxsaW5nLWRlY2VudHJhbGl6ZWQifSx7IlgtQW16LUFsZ29yaXRobSI6IkFXUzQtSE1BQy1TSEEyNTYifSx7IlgtQW16LUNyZWRlbnRpYWwiOiJBS0lBUTNFR1VEVUg3TVRYN0tXSC8yMDI0MTAyNS91cy1lYXN0LTEvczMvYXdzNF9yZXF1ZXN0In0seyJYLUFtei1EYXRlIjoiMjAyNDEwMjVUMDczODUzWiJ9LHsia2V5IjoiZml2ZXIvMS8wLjAxMzc1NTM4Mzc2NTY5MDA3Ny9pbWFnZS5qcGcifV19');
    formData.append('X-Amz-Signature', '1fa5fafc4824ea3817af2c914e614052d02da9c4824892dbc86a066f238bebbf');
    formData.append('success_action_status', '201');
    formData.append('Content-Type', 'image/png');
  
    // Append the file to the FormData object
    formData.append('file', file);
  
    try {
      // Send the POST request to S3
      const response = await fetch(s3Url, {
        method: 'POST',
        body: formData,
      });
  
      if (response.ok) {
        console.log('File uploaded successfully!');
      } else {
        console.error('File upload failed:', await response.text());
      }
    } catch (error) {
      console.error('Error during upload:', error);
    }
  }
  
  // Event listener for file input
  document.getElementById('file-input').addEventListener('change', function(event) {
    const file = event.target.files[0];
    if (file) {
      uploadFile(file);
    } else {
      console.error('No file selected');
    }
  });
  