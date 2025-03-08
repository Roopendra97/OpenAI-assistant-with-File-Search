import OpenAI from 'openai';
import dotenv from 'dotenv';
dotenv.config();
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY
});
import fs from 'fs';

export async function createAssistant(req, res) {
    const assistantName = req.body.assistantName;
    try {
      const assistant = await openai.beta.assistants.create({
          name: assistantName,
          instructions: "You are an expert financial analyst. Use your knowledge base to answer questions about audited financial statements.",
          model: "gpt-4o",
          tools: [{ type: "file_search" }]
        });
        res.status(200).json({ assistant });
    } catch (error) {
      console.error("Error creating assistant:", error);
      res.status(500).json({ error: "Failed to create assistant." });
    }
}

// response from createAssistant
// {
// 	"assistant": {
// 		"id": "asst_HQBIhwlwaX1DzGxo7pOr2WfV",
// 		"object": "assistant",
// 		"created_at": 1741430638,
// 		"name": "Financial Statement",
// 		"description": null,
// 		"model": "gpt-4o",
// 		"instructions": "You are an expert financial analyst. Use your knowledge base to answer questions about audited financial statements.",
// 		"tools": [
// 			{
// 				"type": "file_search",
// 				"file_search": {
// 					"ranking_options": {
// 						"ranker": "default_2024_08_21",
// 						"score_threshold": 0
// 					}
// 				}
// 			}
// 		],
// 		"top_p": 1,
// 		"temperature": 1,
// 		"reasoning_effort": null,
// 		"tool_resources": {
// 			"file_search": {
// 				"vector_store_ids": [
// 					"vs_67cc216041488191bbec3352adb04628"
// 				]
// 			}
// 		},
// 		"metadata": {},
// 		"response_format": "auto"
// 	}
// }

export async function createVectorStoreAndUploadFiles(req, res){
    try {
        const filePath = "edgar/financial-statement-analysis.pdf";

        // Step 1: Check if the file exists before proceeding
        if (!fs.existsSync(filePath)) {
            throw new Error(`❌ File not found: ${filePath}`);
        }
        console.log(`✅ File found: ${filePath}`);

        // Step 2: Upload the file to OpenAI first
        const fileResponse = await openai.files.create({
            file: fs.createReadStream(filePath),
            purpose: "assistants", // Required to store the file for assistant use
        });

        const fileId = fileResponse.id;
        console.log(`✅ File uploaded successfully with ID: ${fileId}`);

        // Step 3: Create a Vector Store
        const vectorStore = await openai.beta.vectorStores.create({
            name: "Financial Documents",
        });
        console.log(`✅ Vector Store created with ID: ${vectorStore.id}`);

        // Step 4: Attach the uploaded file to the Vector Store
        const fileBatch = await openai.beta.vectorStores.fileBatches.createAndPoll(vectorStore.id, {
            file_ids: [fileId], // Pass file ID instead of file streams
        });

        console.log("✅ File associated with vector store successfully:", fileBatch);
        res.status(200).json({ fileBatch });
    } catch (error) {
        console.error("❌ Error uploading file:", error.message);
        res.status(500).json({ error: error.message });
    }
}

// response from createVectorStoreAndUploadFiles
// {
// 	"fileBatch": {
// 		"id": "vsfb_36a85f1c1dda45379cb5716c4d278d6c",
// 		"object": "vector_store.file_batch",
// 		"created_at": 1741447803,
// 		"status": "completed",
// 		"vector_store_id": "vs_67cc6273ec148191bbf4334b3462aa50",
// 		"file_counts": {
// 			"in_progress": 0,
// 			"completed": 1,
// 			"failed": 0,
// 			"cancelled": 0,
// 			"total": 1
// 		}
// 	}
// }

export async function connectAssistantToVectorStore(req, res){
    try {
        const assistantId = req.body.assistantId;
        const vectorStoreId = req.body.vectorStoreId;
        const assistant = await openai.beta.assistants.update(assistantId, {
            tool_resources: { file_search: { vector_store_ids: [vectorStoreId] } }
        });
        res.status(200).json({ assistant });
    } catch (error) {
        console.error("Error connecting assistant to vector store:", error);
        res.status(500).json({ error: "Failed to connect assistant to vector store." });
    }
}

// response from connectAssistantToVectorStore
// {
// 	"assistant": {
// 		"id": "asst_HQBIhwlwaX1DzGxo7pOr2WfV",
// 		"object": "assistant",
// 		"created_at": 1741430638,
// 		"name": "Financial Statement",
// 		"description": null,
// 		"model": "gpt-4o",
// 		"instructions": "You are an expert financial analyst. Use your knowledge base to answer questions about audited financial statements.",
// 		"tools": [
// 			{
// 				"type": "file_search",
// 				"file_search": {
// 					"ranking_options": {
// 						"ranker": "default_2024_08_21",
// 						"score_threshold": 0
// 					}
// 				}
// 			}
// 		],
// 		"top_p": 1,
// 		"temperature": 1,
// 		"reasoning_effort": null,
// 		"tool_resources": {
// 			"file_search": {
// 				"vector_store_ids": [
// 					"vs_67cc216041488191bbec3352adb04628"
// 				]
// 			}
// 		},
// 		"metadata": {},
// 		"response_format": "auto"
// 	}
// }

export async function createThread(req, res){
    try {
        const thread = await openai.beta.threads.create();
        res.status(200).json({ thread });
    } catch (error) {
        console.error("Error creating thread:", error);
        res.status(500).json({ error: "Failed to create thread." });
    }
}

// response from createThread
// {
// 	"thread": {
// 		"id": "thread_jjboi9OkvTS61fOaoWB5e0fi",
// 		"object": "thread",
// 		"created_at": 1741432502,
// 		"metadata": {},
// 		"tool_resources": {}
// 	}
// }

export async function conversation(req, res) {
    try {
        console.log("conversationControllers function called");
        const {threadId, message, assistantId } = req.body;
        console.log({threadId, message, assistantId});
        
        if (!threadId || !message || !assistantId) {
            return res.status(400).json({ error: "Missing required fields." });
        }
    
        res.setHeader("Content-Type", "text/event-stream");
        res.setHeader("Cache-Control", "no-cache");
        res.setHeader("Connection", "keep-alive");
        res.setHeader("X-Accel-Buffering", "no");
        res.flushHeaders && res.flushHeaders();
    
        console.log("Attempting to get stream from OpenAI...");
        const stream = await sendMessageToOpenAI(threadId, message, assistantId);
    
        if (!stream) {
            console.error("Stream is undefined or null.");
            return res.status(500).json({ error: "Failed to initialize stream." });
        }
    
        stream.on("textCreated", () => {
            console.log("Stream event: textCreated");
            res.write("data: assistant started responding...\n\n");
            if (res.flush) res.flush();
        })
        .on("textDelta", (textDelta) => {
            console.log("Stream event: textDelta", textDelta);
            if (textDelta.value) {
                // assistantResponse += textDelta.value;
                res.write(`${textDelta.value}\n\n`);
                if (res.flush) res.flush();
            }
        })
        .on("end", () => {
            console.log("Stream event: end");
            res.write("[END]\n\n");
            res.end();
        })
        .on("error", (error) => {
            console.error("Stream error:", error);
            res.write(`data: Error: ${error.message}\n\n`);
            res.end();
        });

    } catch (error) {
        console.error("Controller Error:", error);
        res.status(500).json({ error: error.message });
    }
}

// response from conversation is data will be streamed


const sendMessageToOpenAI = async (threadId, message, assistantId) => {
  try {
    // Step 1: Send user message to OpenAI
    await openai.beta.threads.messages.create(threadId, {
      role: "user",
      content: message,
    });
    // Step 2: Start streaming assistant response
    const run = openai.beta.threads.runs.stream(threadId, { assistant_id: assistantId });

    return run; // Return stream for controller to handle

  } catch (error) {
    console.error("OpenAI API Error:", error);
    throw error; // Pass error to controller
  }
};
  