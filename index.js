const express = require('express');
const cors = require('cors');
require("dotenv").config();
const { MongoClient, ServerApiVersion } = require('mongodb');
const app = express();
const port = process.env.PORT || 5000;

// middleware
app.use(cors());
app.use(express.json());

// certificates
// rkEnrhpfvnYfYRqL

const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASS}@cluster0.wlyagdq.mongodb.net/?retryWrites=true&w=majority`;

// Create a MongoClient with a MongoClientOptions object to set the Stable API version
const client = new MongoClient(uri, {
  serverApi: {
    version: ServerApiVersion.v1,
    strict: true,
    deprecationErrors: true,
  }
});

async function run() {
  try {
    // Connect the client to the server	(optional starting in v4.7)
    // await client.connect();

    const certificateCollection = client.db('certificateDB').collection('certificate');

    app.get("/certificates", async (req, res) => {
        const result = await certificateCollection.find().toArray();
        res.send(result);
      });

      app.post('/certificates', async (req, res) => {
        try {
          const certificates = req.body;
      
          // Ensure certificates is an array
          if (!Array.isArray(certificates)) {
            return res.status(400).json({ error: 'Invalid data format' });
          }
      
          // Ensure certificates array is not empty
          if (certificates.length === 0) {
            return res.status(400).json({ error: 'No certificates to insert' });
          }
      
          // Extract unique nameText values from the incoming certificates
          const uniqueNameTextValues = Array.from(new Set(certificates.map(cert => cert.nameText)));
      
          // Find existing certificates with the same nameText values
          const existingCertificates = await certificateCollection.find({ nameText: { $in: uniqueNameTextValues } }).toArray();
      
          // Filter out certificates that already exist
          const newCertificates = certificates.filter(cert => !existingCertificates.some(existingCert => existingCert.nameText === cert.nameText));
      
          // Omit the _id property to allow MongoDB to generate it automatically
          const documentsToInsert = newCertificates.map((certificate) => {
            // Ensure each certificate is an object
            if (certificate && typeof certificate === 'object' && certificate !== null) {
              const { _id, ...rest } = certificate;
              return rest;
            } else {
              // Handle the case where the certificate is not in the expected format
              console.error('Invalid certificate format:', certificate);
              return null; // or handle in a way that fits your application
            }
          });
      
          // Filter out null certificates
          const validDocuments = documentsToInsert.filter((doc) => doc !== null);
      
          // Check if there are valid documents to insert
          if (validDocuments.length === 0) {
            return res.status(400).json({ error: 'No valid certificates to insert' });
          }
      
          const result = await certificateCollection.insertMany(validDocuments);
      
          // Return information about existing certificates
          res.status(200).json({
            insertedCount: result.insertedCount,
            insertedIds: result.insertedIds,
            existingCount: existingCertificates.length,
            existingCertificates: existingCertificates.map(cert => cert.nameText),
          });
        } catch (error) {
          console.error('Error inserting certificates:', error);
          res.status(500).json({ error: 'Internal Server Error' });
        }
      });
        

      app.get('/singleCertificate/:nameText', async (req, res) => {
        const nameText = req.params.nameText;
        const query = { nameText: nameText }; // Assuming 'nameText' is the correct field
        const result = await certificateCollection.findOne(query);
        res.send(result);
      });
      
  
      

    // Send a ping to confirm a successful connection
    await client.db("admin").command({ ping: 1 });
    console.log("Pinged your deployment. You successfully connected to MongoDB!");
  } finally {
    // Ensures that the client will close when you finish/error
    // await client.close();
  }
}
run().catch(console.dir);


app.get('/', (req,res)=>{
    res.send('MGC server is running');
})

app.listen(port, () => {
    console.log(`MGC Server is running on port ${port}`)
})