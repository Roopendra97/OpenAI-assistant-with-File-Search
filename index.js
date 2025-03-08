import express from 'express';
import dotenv from 'dotenv';
import { createAssistant, createThread, conversation, createVectorStoreAndUploadFiles, connectAssistantToVectorStore } from './function-configuration.js';

dotenv.config(); // Ensure this is called before accessing process.env

const app = express();
const port = process.env.PORT || 4000;

// Middleware to parse JSON requests
app.use(express.json());


// Basic route
app.get('/', (req, res) => {
    res.send('Welcome to the OpenAI Assistant with File Search!');
});

app.post('/create-assistant', createAssistant);
//http://localhost:4000/create-assistant
//{
// 	"assistantName": "your_assistant_name"
// }

app.post('/create-file', createVectorStoreAndUploadFiles);
//http://localhost:4000/create-file


app.post('/connect-assistant-to-vector-store', connectAssistantToVectorStore);
//http://localhost:4000/connect-assistant-to-vector-store
//{
// 	"assistantId": "your_assistant_id",
// 	"vectorStoreId": "your_vector_store_id"
// }


app.post('/create-thread', createThread);
//http://localhost:4000/create-thread


app.post('/conversation', conversation);
//http://localhost:4000/conversation
//{
// 	"threadId": "your_thread_id",
// 	"message": "your_message",
// 	"assistantId": "your_assistant_id"
// }


// Start the server
app.listen(port, () => {
    console.log(`Server is running on http://localhost:${port}`);
});
