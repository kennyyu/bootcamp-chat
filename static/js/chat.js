$(document).ready(function() {

    // message types
    var MESSAGE_TYPES = {
        NEW_USER : 0,
        MESSAGE : 1,
        LEAVE_USER : 2,
        ONLINE_USERS : 3,
    };

    // username for this client
    var USERNAME = "";

    // useful constants
    var ENTER_KEY = 13;
    var WS_URL = "ws://" + ChatApp.HOST + ":" + ChatApp.PORT + "/" + ChatApp.CHAT_URL

    var usernamebox = $("#username");               // input box for username
    var usernamebutton = $("#username-start");      // enter chat button
    var usernameactions = $("#username-actions");   // div containing username inputs
    var usernamespan = $("#username-prepend");      // contains the submitted username
    var userslist = $("#users-online");             // ul element containing users

    var inputbox = $("#input");                     // input box for messages
    var actionsbox = $("#actions");                 // div containing message inputs
    var sendbutton = $("#send");                    // send button
    var messages = $("#messages");                  // ul element with all messages
    var messagescontainer = $("#messages-container"); // div containing all messages

    // Returns the sanitized version of the input string.
    // See: http://shebang.brandonmintern.com/foolproof-html-escaping-in-javascript
    function escapeHtml(str) {
        var div = document.createElement('div');
        div.appendChild(document.createTextNode(str));
        return div.innerHTML;
    };

    // Hide messages on default, focus on username input box
    usernamebox.focus();
    actionsbox.hide();
    messagescontainer.hide();

    // Create a web socket to receive chat updates
    var ws = new WebSocket(WS_URL);
    ws.onopen = function() {
        console.log("opened web socket: " + WS_URL);
    };
    ws.onclose = function(msg) {
        var message = {
            type : MESSAGE_TYPES.LEAVE_USER,
            username : USERNAME,
        };
        ws.send(JSON.stringify(message));
        console.log("closed web socket: " + WS_URL + ", message: " + msg);
    };
    ws.onmessage = function(msg) {
        var messagebox = $("<div></div>");
        var msg_time = new Date(msg.timeStamp);
        var message = JSON.parse(msg.data);
        switch (message.type) {
            case MESSAGE_TYPES.NEW_USER:
                // new user has joined--add user name to currently online list
                userslist.append($("<li></li>")
                    .attr("id", "user-" + message.username)
                    .text(message.username));
                messages.prepend($("<li></li>")
                    .text(message.username + " entered!"));              
                messages.prepend($("<li></li>")
                    .addClass("nav-header")
                    .text("[" + msg_time + "]"));
                break;
            case MESSAGE_TYPES.LEAVE_USER:
                // user has left--remove user name from currently online list
                $("#user-" + message.username).remove();
                messages.prepend($("<li></li>")
                    .text(message.username + " left!"));              
                messages.prepend($("<li></li>")
                    .addClass("nav-header")
                    .text("[" + msg_time + "]"));
                break;
            case MESSAGE_TYPES.MESSAGE:
                // received plain old IM
                messages.prepend($("<li></li>")
                    .text(message.username + ": " + message.text));              
                messages.prepend($("<li></li>")
                    .addClass("nav-header")
                    .text("[" + msg_time + "]"));
                break;
            case MESSAGE_TYPES.ONLINE_USERS:
                // update list with current users
                userslist.html(""); // clear list
                userslist.append($("<li></li>")
                    .addClass("nav-header")
                    .text("Online Now"));
                for (var i in message.users) {
                    userslist.append($("<li></li>")
                        .attr("id", "user-" + message.users[i])
                        .text(message.users[i]));
                }
                break;
            default:
                console.log("unrecognized message type: " + msg);
        }
        messages.prepend($("<li></li>").addClass("divider"));
    };

    // Close the socket connection when the window closes
    $(window).unload(function() {
        ws.onclose();
    });

    // Request username
    usernamebutton.click(function() {
        var username = escapeHtml(usernamebox.val());
        if (username == "") {
            return false; // do nothing if nothing is provided
        }
        USERNAME = username;
        var message = {
            type : MESSAGE_TYPES.NEW_USER,
            username : username,
        };
        ws.send(JSON.stringify(message));

        // hide the username box
        usernameactions.hide();

        // show the IM prompt using the newly defined username
        usernamespan.text(USERNAME);
        actionsbox.show("fast");
        messagescontainer.show("fast");
        inputbox.focus();
        return false;
    });

    // Add a click handler for send
    sendbutton.click(function() {
        var text = escapeHtml(inputbox.val());
        if (text == "") {
            return false; // do nothing if nothing is provided
        }
        inputbox.val(""); // clear the input box
        var message = {
            type : MESSAGE_TYPES.MESSAGE,
            username : USERNAME,
            text : text,
        };
        ws.send(JSON.stringify(message));
        return false;
    });

    // Add a handler for when the enter key is pressed while in IM box
    inputbox.keypress(function(e) {
        if (e.which == ENTER_KEY) {
            sendbutton.click();
            e.preventDefault();
        }
    });
    
});