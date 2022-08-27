document.addEventListener('DOMContentLoaded', function() {

  // Use buttons to toggle between views
  document.querySelector('#inbox').addEventListener('click', () => load_mailbox('inbox'));
  document.querySelector('#sent').addEventListener('click', () => load_mailbox('sent'));
  document.querySelector('#archived').addEventListener('click', () => load_mailbox('archive'));
  document.querySelector('#compose').addEventListener('click', () => compose_email('', '', ''));

  // By default, load the inbox
  load_mailbox('inbox');

});

function compose_email(email_recipient, email_subject, email_body) {

  // Show compose view and hide other views
  document.querySelector('#emails-view').style.display = 'none';
  document.querySelector('#compose-view').style.display = 'block';
  document.querySelector('#emails-details-view').style.display = 'none';

  // Clear out composition fields
  document.querySelector('#compose-recipients').value = email_recipient;
  document.querySelector('#compose-subject').value = email_subject;
  document.querySelector('#compose-body').value = email_body;

  // Send Mail
  document.querySelector('form').onsubmit = function() {

    let recipients = document.querySelector("#compose-recipients").value
    let subject = document.querySelector("#compose-subject").value
    let body = document.querySelector("#compose-body").value

    console.log(recipients)

    fetch('/emails', {
      method: 'POST',
      body: JSON.stringify({
          recipients: recipients,
          subject: subject,
          body: body
      })
    })
    .then(response => response.json())
    .then(result => {
      if (!result.error) {
        load_mailbox('sent');
      }
      else {
        prompt('Invalid email')
      }  
    });

    
    return false;

  }
}

function load_mailbox(mailbox) {
  
  // Show the mailbox and hide other views
  document.querySelector('#emails-view').style.display = 'block';
  document.querySelector('#compose-view').style.display = 'none';
  document.querySelector('#emails-details-view').style.display = 'none';

  // Show the mailbox name
  document.querySelector('#emails-view').innerHTML = `<h3>${mailbox.charAt(0).toUpperCase() + mailbox.slice(1)}</h3>`

  // Show the emails within the mailbox
  fetch('/emails/' + mailbox)
  .then(response => response.json())
  .then(emails => {

      // Iterates over each email to display it within the mailbox
      for (let i = 0; i < emails.length; i++) {
        let email = emails[i]

        // Email structure within the mailbox
        if (email.read === false) {
          display_email = `<div style="border: thin solid black">${'<strong>From: </strong>' + email.sender + " " + email.subject + " " + email.timestamp}</div>` + "<br>";
        }
        else {
          display_email = `<div style="border: thin solid black; background-color: grey">${'<strong>From: </strong>' + email.sender + " " + email.subject + " " + email.timestamp}</div>` + "<br>";
        }
        
        // Creates an element to display each mail with an event handler to view the mail details
        const element = document.createElement('div');
        element.innerHTML = display_email;
        element.addEventListener('click', () => email_details(email.id, mailbox));
        document.querySelector('#emails-view').append(element);
      }
  });
}

function email_details(email_id, mailbox) {
  
  // Show the mailbox and hide other views
  document.querySelector('#emails-view').style.display = 'none';
  document.querySelector('#compose-view').style.display = 'none';
  document.querySelector('#emails-details-view').style.display = 'block';

  // Mark email as read
  fetch('/emails/' + email_id, {
    method: 'PUT',
    body: JSON.stringify({
        read: true
    })
  })

  // Fetch email's details
  fetch('/emails/' + email_id)
  .then(response => response.json())
  .then(email => {

    // Clean the emails-details-view from previous emails
    document.querySelector('#emails-details-view').innerHTML = " "

    // Email structure within emails-details-view
    display_email = `<div>${'<strong><br>From:  </strong>' + email.sender + "<br>" + '<strong>To:  </strong>' + email.recipients + "<br><br>" + '<strong>' + email.subject + '</strong>' + "<br><br>" + email.timestamp  + "<br>" + email.body}</div>` + "<br>";

    // Create div to present the email
    const element = document.createElement('div');
    element.innerHTML = display_email;

    // Create Archive button
    const archive_button = document.createElement('button');
    archive_button.className = 'btn btn-sm btn-outline-primary'

    // Check whether the email is archived or not
    if (email.archived) {
      archive_button.innerHTML = 'Unarchive'
    }
    else {
      archive_button.innerHTML = 'Archive'
    }

    // Create reply button
    const reply_button = document.createElement('button');
    reply_button.className = 'btn btn-sm btn-outline-primary'

    // Check whether the email is archived or not
    reply_button.innerHTML = 'Reply'

    
    // Append the archive button, reply button and selected email to the DOM
    if (mailbox !== 'sent') {
      document.querySelector('#emails-details-view').append(archive_button);
    }
    document.querySelector('#emails-details-view').append(reply_button);
    document.querySelector('#emails-details-view').append(element);

    // Add event handler for the archive_button
    archive_button.addEventListener('click', () => archive_email(email.id, !email.archived));
    
    let email_sender = email.sender
    let email_subject = email.subject
    let include_re = email_subject.includes('Re: ')
    console.log(include_re)
    if (!include_re) {
      email_subject = `${'Re: ' + email.subject}`
      console.log(email_subject)
    }

    let email_body = `${'On ' + email.timestamp + email.sender + 'wrote: ' + email.body}`

    reply_button.addEventListener('click', () => compose_email(email_sender, email_subject, email_body));
  });
}

function archive_email(email_id, archieved) {
  // Set the selected email as archieved
  fetch('/emails/' + email_id, {
    method: 'PUT',
    body: JSON.stringify({
        archived: archieved
    })
  })
  load_mailbox('inbox');
}
