document.addEventListener('DOMContentLoaded', function () {

  // Use buttons to toggle between views
  document.querySelector('#inbox').addEventListener('click', () => load_mailbox('inbox'));
  document.querySelector('#sent').addEventListener('click', () => load_mailbox('sent'));
  document.querySelector('#archived').addEventListener('click', () => load_mailbox('archive'));
  document.querySelector('#compose').addEventListener('click', compose_email);
  document.querySelector('#compose-form').addEventListener('submit', send_email);

  // By default, load the inbox
  load_mailbox('inbox');
});

function compose_email() {

  // Show compose view and hide other views
  document.querySelector('#emails-view').style.display = 'none';
  document.querySelector('#compose-view').style.display = 'block';
  document.querySelector('#open-view').style.display = 'none';

  // Clear out composition fields
  document.querySelector('#compose-recipients').value = '';
  document.querySelector('#compose-subject').value = '';
  document.querySelector('#compose-body').value = '';
}

function load_mailbox(mailbox) {

  // Show the mailbox and hide other views
  document.querySelector('#emails-view').style.display = 'block';
  document.querySelector('#compose-view').style.display = 'none';
  document.querySelector('#open-view').style.display = 'none';

  // Show the mailbox name
  document.querySelector('#emails-view').innerHTML = `<h3>${mailbox.charAt(0).toUpperCase() + mailbox.slice(1)}</h3>`;

  fetch(`/emails/${mailbox}`)
    .then(response => response.json())
    .then(emails => {
      console.log(emails);
      emails.forEach(email => {
        // si mailbox === 'sent', mostrar recipient
        // si mail.read === true, background-color: grey, else white
        const element = document.createElement('div');
        element.style.border = '1px solid rgb(220, 220, 220)';
        element.style.margin = '5px 0px';
        if (mailbox === 'sent') {
          element.innerHTML = `<B>To</b>: ${email.recipients} (${email.timestamp}):<br> <b>Subject</b>: ${email.subject}`;
        } else {
          element.innerHTML = `<b>From</b>: ${email.sender} (${email.timestamp}):<br> <b>Subject</b>: ${email.subject}`;
        }
        if (email.read === true) {
          element.style.backgroundColor = 'rgb(240, 240, 240)';
        }
        element.addEventListener('click', event => open_email(email, mailbox));
        document.querySelector('#emails-view').append(element);
      });
    });
}

function send_email(event) {
  const recipients = document.querySelector('#compose-recipients').value;
  const subject = document.querySelector('#compose-subject').value;
  const body = document.querySelector('#compose-body').value;
  fetch('/emails', {
    method: 'POST',
    body: JSON.stringify({
      recipients: recipients,
      subject: subject,
      body: body
    })
  })
    .then(response => response.json())
    .then(result => console.log(result))
    .catch(error => console.log('Error:', error));
  load_mailbox('sent');
}

function open_email(email, mailbox) {
  document.querySelector('#emails-view').style.display = 'none';
  document.querySelector('#compose-view').style.display = 'none';
  document.querySelector('#open-view').style.display = 'block';

  fetch(`/emails/${email.id}`, {
    method: 'PUT',
    body: JSON.stringify({
      read: true
    })
  });

  document.querySelector('#open-view').innerHTML = `
    <h5>From: ${email.sender}</h5>
    <h5>To: ${email.recipients}</h5>
    <h5>Subject: ${email.subject}</h5>
    <h5>Timestamp: ${email.timestamp}</h5>
    <div>${email.body}</div>
  `;

  if (mailbox === 'inbox') {
    const archive_btn = document.createElement('button');
    archive_btn.className = 'btn btn-sm btn-outline-primary';
    archive_btn.style = 'margin: 10px 5px';
    archive_btn.innerHTML = 'Archive';
    archive_btn.addEventListener('click', event => {
      fetch(`/emails/${email.id}`, {
        method: 'PUT',
        body: JSON.stringify({
          archived: true
        })
      }).then(response => load_mailbox('inbox'));
    });
    document.querySelector('#open-view').append(archive_btn);
  }

  if (mailbox === 'archive') {
    const archive_btn = document.createElement('button');
    archive_btn.className = 'btn btn-sm btn-outline-primary';
    archive_btn.style = 'margin: 10px 5px';
    archive_btn.innerHTML = 'Unarchive';
    archive_btn.addEventListener('click', event => {
      fetch(`/emails/${email.id}`, {
        method: 'PUT',
        body: JSON.stringify({
          archived: false
        })
      }).then(response => load_mailbox('inbox'));
    });
    document.querySelector('#open-view').append(archive_btn);
  }

  if (mailbox !== 'sent') {
    const reply_btn = document.createElement('button');
    reply_btn.className = 'btn btn-sm btn-outline-primary';
    reply_btn.style = 'margin: 10px 5px';
    reply_btn.innerHTML = 'Reply';

    reply_btn.addEventListener('click', event => {
      compose_email();
      document.querySelector('#compose-recipients').value = email.recipients;
      document.querySelector('#compose-subject').value = `Re: ${email.subject}`;
      document.querySelector('#compose-body').value = `On ${email.timestamp} ${email.sender} wrote:<br> ${email.body}`;
    });
    document.querySelector('#open-view').append(reply_btn);
  }
}
