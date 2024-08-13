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


import React, { useState, useEffect } from "react";
import {
  Comment,
  Form,
  Header,
  Grid,
  Segment,
  Divider,
  Container,
  Accordion,
  Icon,
  Button,
} from "semantic-ui-react";

import { sendRequestToApi } from "./utils/sendRequestToAPI";

const ChatScreen = () => {
  const [messages, setMessages] = useState([
    { id: 1, sender: "system", text: "Hello there!" },
  ]);
  const [newMessage, setNewMessage] = useState("");
  const [openIndexes, setOpenIndexes] = useState([]);
  const [selectedFiles, setSelectedFiles] = useState([]);
  const [dlpEnabled, setDlpEnabled] = useState(false);
  const [textModerationEnabled, setTextModerationEnabled] = useState(false);
  const [textModerationValue, setTextModerationValue] = useState(50);
  const [selectLLM, setSelectLLM] = useState("");
  const [llmModelProviderValue, setllmModelProviderValue] = useState("");
  const [isSending, setIsSending] = useState(false);

  const handleMessageChange = (e) => {
    setNewMessage(e.target.value);
  };

  const sendMessage = () => {
    if (newMessage.trim() !== "") {
      setIsSending(true);
      const newMsg = {
        id: messages.length + 1,
        sender: "user",
        text: newMessage,
      };
      const payload = {
        prompt: newMessage,
        nlpFilterLevelEnabled : textModerationEnabled,
        nlpFilterLevel: textModerationValue,
        dlpEnabled : dlpEnabled,
        inspectTemplate: null,
        deidentifyTemplate: null,
      };
      setMessages((prevMessages) => [...prevMessages, newMsg]);

      sendRequestToApi("/prompt", payload)
        .then(({response}) => {
          const {text, id, sender} = response

          const msgResponse = {
            id : "wkejrkjlksajda",
            text : text,
            sender : 'system'
          }
          setMessages((prevMessages) => [...prevMessages, msgResponse]);
        })
        .catch((error) => {
          console.error(error);
          const errorMsg = {
            id: messages.length + 2,
            sender: "system",
            text: `Error: ${error.message}`,
          };
          setMessages((prevMessages) => [...prevMessages, errorMsg]);
        })
        .finally(() => {
          setIsSending(false);
          setNewMessage("");
        });
    }
  };

  const handleFileChange = (e) => {
    setSelectedFiles(Array.from(e.target.files));
  };

  const handleUpload = async () => {
    if (selectedFiles.length === 0) return;

    const formData = new FormData();
    selectedFiles.forEach((file) => formData.append("files", file));
    sendRequestToApi(
      "/upload_documents",
      formData,
      (contentType = "multipart/form-data")
    )
      .then((data) => {
        console.log(data);
      })
      .catch((error) => {
        console.error(error);
      })
      .finally(() => {
        setSelectedFiles([]);
      });
  };

  const handleAccordionClick = (index) => {
    // When an accordion is clicked, toggle its state in the array
    setOpenIndexes((prevIndexes) =>
      prevIndexes.includes(index)
        ? prevIndexes.filter((i) => i !== index)
        : [...prevIndexes, index]
    );
  };

  const huggingFaceLLMModelOptions = [
    { key: "1", text: "bloom-7b1", value: "bigscience/bloom-7b1" },
    {
      key: "2",
      text: "Llama-2-7b-chat-hf",
      value: "meta-llama/Llama-2-7b-chat-hf",
    },
    { key: "3", text: "Microsoft Phi2", value: "microsoft/phi-2" },
    {
      key: "4",
      text: "Mistral-7B-Instruct-v0.2",
      value: "mistralai/Mistral-7B-Instruct-v0.2",
    },
    { key: "5", text: "Mistral-7B-v0.1", value: "mistralai/Mistral-7B-v0.1" },
  ];

  const vertexAILLMModelOptions = [
    { key: "1", text: "Gemini Flash 001", value: "gemini-1.5-flash-001" },
    {
      key: "2",
      text: "Gemini Pro 001",
      value: "gemini-1.5-pro-001",
    },
    {
      key: "3",
      text: "Gemma 2",
      value: "gemma2-2b-it",
    },
    { key: "4", text: "Palm 2", value: "text-bison" },

  ];

  useEffect(() => {
    const fetchData = async () => {
      try {
        const response = await fetch(
          "/get_chat_history"
        )
        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }
        const { history_messages } = await response.json();
        setMessages((prevMessages) => [...prevMessages, history_messages]);
      } catch (err) {
        console.error(error);
      }
    };
    fetchData();
  }, []);

  return (
    <Form onSubmit={sendMessage}>
      <Grid stackable>
        <Grid.Row verticalAlign="middle">
          <Grid.Column>
            <Segment basic size="huge">
              <Container padded>
                <Header as="h1" color="blue" textAlign="center">
                  RAG on GKE
                </Header>
              </Container>
            </Segment>
          </Grid.Column>
        </Grid.Row>
        <Grid.Row style={{ margin: "3.4rem" }}>
          <Grid.Column width={10}>
            <Segment padded style={{ height: "74vh" }}>
              <Container>
                <Comment.Group
                  style={{
                    height: "57vh",
                    marginBottom: "2.3em",
                    overflowY: "auto",
                    maxWidth: "fit-content",
                  }}
                >
                  <Header as="h3" dividing>
                    Chat
                  </Header>
                  {messages.map((message) => (
                    <Comment key={message.id}>
                      <Comment.Content className={message.sender}>
                        <Comment.Author as="a">{message.sender}</Comment.Author>
                        <Comment.Text>{message.text}</Comment.Text>
                      </Comment.Content>
                    </Comment>
                  ))}
                </Comment.Group>

                <Form.Group>
                  <Form.Input
                    value={newMessage}
                    onChange={handleMessageChange}
                    placeholder="Type your message..."
                    width={14}
                    disabled={isSending}
                    style={{ border: "0.1rem solid black" }}
                  />
                  <Form.Button content="Send" icon="edit" primary />
                </Form.Group>
              </Container>
            </Segment>
          </Grid.Column>

          <Grid.Column width={6}>
            <Segment>
              <Header as="h1">Configure your RAG application.</Header>
              <Accordion>
                <Accordion.Title
                  active={openIndexes.includes(0)}
                  index={0}
                  onClick={() => handleAccordionClick(0)}
                >
                  <Header as="h2">
                    <Icon name="dropdown" /> Configure your LLM.
                  </Header>
                </Accordion.Title>
                <Accordion.Content active={openIndexes.includes(0)}>
                  <Segment>
                    <Header as="h5">
                      Select provider:
                    </Header>
                    <Form.Group inline>
                      <Form.Radio
                        label='Vertex AI'
                        value='vertex_ai'
                        checked={llmModelProviderValue === 'vertex_ai'}
                        onChange={() => setllmModelProviderValue('vertex_ai')}
                      />
                      <Form.Radio
                        label='HuggingFace'
                        value='huggingface'
                        checked={llmModelProviderValue === 'huggingface'}
                        onChange={() => setllmModelProviderValue('huggingface')}
                      />
                    </Form.Group>
                  </Segment>
                  {/* <Segment>
                    <Header as="h5">
                      Select one of the following llm models:
                    </Header>
                    <Form.Select
                      options={llmModelProviderValue === 'huggingface' ? huggingFaceLLMModelOptions : vertexAILLMModelOptions}
                      value={selectLLM}
                      onChange={(e, { value }) => setSelectLLM(value)}
                    />
                  </Segment> */}
                </Accordion.Content>
                <Accordion.Title
                  active={openIndexes.includes(1)}
                  index={1}
                  onClick={() => handleAccordionClick(1)}
                >
                  <Header as="h2">
                    <Icon name="dropdown" /> Upload your documents
                  </Header>
                </Accordion.Title>
                <Accordion.Content active={openIndexes.includes(1)}>
                  <Segment>
                    <Header as="h5">
                      Uploading files is necessary for data processing,
                      analysis, or sharing to enable efficient and secure
                      collaboration and storage.
                    </Header>
                    <Form.Input
                      type="file"
                      multiple
                      onChange={handleFileChange}
                    />

                    <Button
                      primary
                      onClick={handleUpload}
                      disabled={selectedFiles.length === 0}
                    >
                      Upload
                    </Button>
                    {/* Add other configuration options here */}
                  </Segment>
                </Accordion.Content>
                <Accordion.Title
                  active={openIndexes.includes(2)}
                  index={2}
                  onClick={() => handleAccordionClick(2)}
                >
                  <Header as="h2">
                    <Icon name="dropdown" /> Enable Data Loss Prevention (DLP)
                  </Header>
                </Accordion.Title>
                <Accordion.Content active={openIndexes.includes(2)}>
                  <Segment>
                    <Header as="h5">
                      Cloud Data Loss Prevention (Cloud DLP) is now part of
                      Sensitive Data Protection, a family of services designed
                      to help you discover, classify, and protect your most
                      sensitive data.
                      <br />
                      Sensitive Data Protection includes data discovery,
                      inspection, de-identification, data risk analysis, and the
                      DLP API.
                      <br />
                      <a
                        href="https://cloud.google.com/security/products/dlp?hl=en"
                        rel="noopener noreferrer"
                        target="_blank"
                      >
                        More information{" "}
                      </a>
                    </Header>
                    <Form.Checkbox
                      label="Enable DLP"
                      toggle
                      onChange={() => setDlpEnabled(!dlpEnabled)}
                    />
                  </Segment>
                </Accordion.Content>
                <Accordion.Title
                  active={openIndexes.includes(3)}
                  index={3}
                  onClick={() => handleAccordionClick(3)}
                >
                  <Header as="h2">
                    <Icon name="dropdown" /> Enable Text Moderation
                  </Header>
                </Accordion.Title>
                <Accordion.Content active={openIndexes.includes(3)}>
                  <Segment>
                    <Header as="h5">
                      Text Moderation analyzes a document against a list of
                      safety attributes, which include "harmful categories" and
                      topic
                      <br />
                      <br />
                      <a
                        href="https://cloud.google.com/natural-language/docs/moderating-text"
                        rel="noopener noreferrer"
                        target="_blank"
                      >
                        More information{" "}
                      </a>
                    </Header>
                    <Form.Checkbox
                      label="Enable"
                      toggle
                      onChange={() =>
                        setTextModerationEnabled(!textModerationEnabled)
                      }
                    />
                    {textModerationEnabled ? (
                      <>
                        <label>
                          <Header as="h5"> Set value </Header>
                        </label>
                        <Form.Input
                          type="range"
                          min={0}
                          max={100}
                          value={textModerationValue}
                          onChange={(e, { value }) =>
                            setTextModerationValue(value)
                          }
                        />
                      </>
                    ) : (
                      <></>
                    )}
                  </Segment>
                </Accordion.Content>

              </Accordion>
            </Segment>
          </Grid.Column>
        </Grid.Row>
        <Divider vertical hidden />
      </Grid>
    </Form>
  );
};

export default ChatScreen;