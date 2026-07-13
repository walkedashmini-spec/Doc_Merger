require('dotenv').config();
const express = require('express');
const path =require(`path`)
const multer  = require('multer')
const fs = require('fs');
const AWS = require('aws-sdk');
const {mergePdfs}  = require('./testPdf')
const upload = multer({ dest: 'uploads/' })
const app = express()
const port = process.env.PORT || 3000;

AWS.config.update({
  accessKeyId: process.env.AWS_ACCESS_KEY_ID,
  secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
  region: process.env.AWS_REGION
});
const s3 = new AWS.S3();

const uploadToS3 = async (filePath, fileName) => {
  const fileContent = fs.readFileSync(filePath);
  const params = {
    Bucket: 'pdf-merger-storage',   // replace with your bucket name
    Key: fileName,
    Body: fileContent,
    ContentType: 'application/pdf'
  };
  const result = await s3.upload(params).promise();
  return result.Location; // URL of uploaded file
};

app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname,"template/index.html"))
})
app.post('/merge', upload.array('pdfs', 10), async (req, res, next) =>{
  try{
     console.log("1. Route entered");

 let filePaths = req.files.map(f => path.resolve(f.path));

console.log("2. Files:", filePaths);
for (const p of filePaths) {
      console.log(`Exists? ${p}:`, fs.existsSync(p));
    }

    console.log("3. Calling mergePdfs...");
 // let d=await  mergePdfs(path.join(__dirname,req.files[0].path),path.join(__dirname,req.files[1].path),path.join(__dirname,req.files[2].path))
  let d= await mergePdfs(filePaths)

   console.log("4. mergePdfs finished:", d);

 let mergedFilePath = `public/${d}.pdf`;

 console.log("5. Uploading to S3...");

 // upload merged PDF to S3
  await uploadToS3(mergedFilePath, `${d}.pdf`);

  // generate signed URL (valid for 5 minutes
  const params = {
    Bucket: 'pdf-merger-storage',   // replace with your bucket name
    Key: `${d}.pdf`,
    Expires: 300 // seconds (5 minutes)
  };

   console.log("7. Cleaning up");

  const signedUrl = s3.getSignedUrl('getObject', params);

  // optional: delete local file after upload
  fs.unlinkSync(mergedFilePath);
   req.files.forEach(f => {
  fs.unlinkSync(f.path);      // removes the temp file from uploads/
});

console.log("8. Sending response");
 // delete uploaded originals
  // respond with signed URL
  res.send(`Download your merged PDF: <a href="${signedUrl}">${signedUrl}</a>`);
}
catch(err)
{
  console.error(err);
    res.status(500).send(err.stack || err.message);
}

});

app.use((err, req, res, next) => {
  console.error("MIDDLEWARE ERROR:", err);

  if (err instanceof multer.MulterError) {
    return res.status(400).send(`Multer Error: ${err.message}`);
  }

  res.status(500).send(err.stack || err.message);
});

app.listen(port, () => {
  console.log(`Example app listening on port http://localhost:${port}`)
})

