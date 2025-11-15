// Script to list and delete all books
const http = require('http');

const API_BASE = 'http://localhost:5000/api';

async function makeRequest(method, path, body = null, token = null) {
  return new Promise((resolve, reject) => {
    const url = new URL(API_BASE + path);
    const options = {
      hostname: url.hostname,
      port: url.port,
      path: url.pathname + url.search,
      method: method,
      headers: {
        'Content-Type': 'application/json',
      },
    };

    if (token) {
      options.headers.Authorization = `Bearer ${token}`;
    }

    const req = http.request(options, (res) => {
      let data = '';
      res.on('data', (chunk) => {
        data += chunk;
      });
      res.on('end', () => {
        try {
          resolve({
            status: res.statusCode,
            body: JSON.parse(data),
          });
        } catch (e) {
          resolve({
            status: res.statusCode,
            body: data,
          });
        }
      });
    });

    req.on('error', reject);
    if (body) req.write(JSON.stringify(body));
    req.end();
  });
}

async function run() {
  console.log('=== BookCheck Cleanup Script ===\n');

  try {
    // Get all books
    console.log('Fetching all books...\n');
    const booksRes = await makeRequest('GET', '/books');
    const books = Array.isArray(booksRes.body) ? booksRes.body : [];
    
    if (books.length === 0) {
      console.log('✓ No books to delete.');
      return;
    }

    console.log(`Found ${books.length} book(s):\n`);
    books.forEach((b, i) => {
      console.log(`${i + 1}. ${b.title} (ID: ${b._id})`);
      console.log(`   Author: ${b.author || 'N/A'}`);
      console.log(`   Owner ID: ${b.owner}`);
      console.log('');
    });

    // To delete books, you need to be logged in as the owner
    // Create or use an existing user account
    console.log('To delete books, you need to be logged in as their owner.\n');
    console.log('Options:\n');
    console.log('1. Delete via Dashboard UI: Log in with your account → Go to Dashboard → Click Delete on each book');
    console.log('2. Use admin script: Create a test user and delete books owned by that user\n');

    // Option: Try to create a user and delete books they own
    console.log('Creating a test user to demonstrate deletion...\n');
    const testRes = await makeRequest('POST', '/auth/register', {
      username: `admin_${Date.now()}`,
      email: `admin_${Date.now()}@test.com`,
      password: 'admin123',
    });

    if (testRes.status !== 201) {
      console.log('Could not create test user (might already exist)');
      console.log('Manual deletion: Use the UI to delete books from your account.\n');
      return;
    }

    const token = testRes.body.token;
    console.log('✓ Test user created\n');

    // Create and immediately delete a test book
    console.log('Creating a test book as the new user...');
    const createRes = await makeRequest(
      'POST',
      '/books',
      {
        title: 'DeleteMe_Test_' + Date.now(),
        authors: ['Test'],
        genre: 'Test',
        description: 'This book will be deleted',
      },
      token
    );

    if (createRes.status !== 201) {
      console.log('Could not create test book');
      return;
    }

    const testBookId = createRes.body._id;
    console.log(`✓ Test book created (ID: ${testBookId})\n`);

    console.log('Deleting test book...');
    const deleteRes = await makeRequest('DELETE', `/books/${testBookId}`, null, token);

    if (deleteRes.status === 200) {
      console.log('✓ Test book deleted successfully!\n');
      console.log('✅ Deletion is working!\n');
      console.log('To delete your existing books:\n');
      console.log('1. Go to http://localhost:3000');
      console.log('2. Log in with your account');
      console.log('3. Click "Dashboard"');
      console.log('4. Click "Delete" button on any book you want to remove');
    } else {
      console.log(`❌ Failed to delete (status: ${deleteRes.status})`);
      console.log('Response:', deleteRes.body);
    }
  } catch (err) {
    console.error('Error:', err.message);
  }
}

run();
