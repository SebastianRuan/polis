const { writeFileSync } = require('fs');
const axios = require('axios');
const { CookieJar } = require('tough-cookie');
const { wrapper } = require('axios-cookiejar-support');

const jar = new CookieJar();
const client = wrapper(axios.create({ jar }));

async function createConversation() {
  try {
    // create a user
    await client.post('http://localhost/api/v3/auth/new', {
      hname: 'Test Participant 01',
      email: 'moderator@polis.test',
      password: 'Te$tP@ssw0rd*',
      password2: 'Te$tP@ssw0rd*',
      gatekeeperTosPrivacy: 'true',
    }, {
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded'
      }
    });

    // create a conversation
    const response = await client.post('http://localhost/api/v3/conversations', {
      is_active: 'true',
      is_draft: 'true',
      topic: 'Conversation Topic',
      description: 'Conversation Description',
    }, {
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded'
      }
    });

    const conversationId = await response.data.conversation_id
    const dummyComments = [
      'Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod tempor incididunt ut labore et dolore magna aliqua.', 
      'Ut enim ad minim veniam, quis nostrud exercitation ullamco laboris nisi ut aliquip ex ea commodo consequat.', 
      'Duis aute irure dolor in reprehenderit in voluptate velit esse cillum dolore eu fugiat nulla pariatur.',
    ]

    // seed comments in the conversation
    for (let i = 0; i < dummyComments.length; i++) {
      await client.post('http://localhost/api/v3/comments', {
        conversation_id: conversationId,
        is_seed: true,
        pid: 'mypid',
        txt: dummyComments[i],
      })
    }

    // logout
    await client.post('http://localhost/api/v3/auth/deregister')

    return conversationId;

  } catch (error) {
    console.error('Error:', error.message);
  }
}

createConversation()
  .then(conversationId => {
    const config = {
      ci: {
        collect: {
          url: ['http://localhost', `http://localhost/${conversationId}`]
        },
        upload: {
          target: 'temporary-public-storage'
        }
      }
    };
    
    writeFileSync('lighthouserc.js', 'module.exports = ' + JSON.stringify(config, null, 2) + ';');    
  })
  .catch(error => {
    console.error('Error creating a conversation:', error);
  });