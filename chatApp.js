Messages = new Mongo.Collection("msgs");
Rooms = new Meteor.Collection("rooms");

Meteor.methods({
    sendMessage: function(message, room) {
        if (!Meteor.userId()) {
            throw new Meteor.Error("not-authorized");
        }
        Messages.insert({
            username: Meteor.user().username,
            text: message,
            room: room,
            createdAt: new Date()
        });
    }
});

if (Meteor.isServer) {
    Meteor.startup(function() {
        // Messages.remove({});
        Rooms.remove({});
        if (Rooms.find().count() === 0) {
            ["Meteor", "JavaScript", "Reactive", "MongoDB", "Polymer", "Angular"].forEach(function(r) {
                Rooms.insert({roomname: r});
            });
        }
    });

    Meteor.publish("messages", function() {
        return Messages.find({}, {sort: {createdAt: -1}});
    });

    Meteor.publish("rooms", function() {
        return Rooms.find();
    });
}

if (Meteor.isClient) {
    Meteor.subscribe("messages");
    Meteor.subscribe("rooms");
    Session.setDefault("currentRoom", "Meteor");

    Template.body.helpers({
        recentMessages: function() {
            return Messages.find({room: Session.get('currentRoom')}, {sort: {createdAt: 1}});
        },
        currentRoom: function() {
            return Session.get("currentRoom");
        },
        timestamp: function() {
            return this.createdAt.toLocaleString();
        },
        rooms: function() {
            return Rooms.find();
        },
        roomstyle: function() {
            return Session.equals("currentRoom", this.roomname) ? "bg-primary" : 'text-muted';
        }
    });

    Template.body.events({
        "submit .new-message": function(event) {
            var text = event.target.text.value;
            var currentRoom = Session.get("currentRoom");

            // prevent send empty msjs..
            if (_.isEmpty(text)) {
                return false;
            }

            Meteor.call("sendMessage", text, currentRoom);
            event.target.text.value = '';
            $(event.currentTarget).focus();

            return false;
        },
        'click li': function(event) {
            Session.set("currentRoom", event.target.innerText);
            ServerSession.set('currentRoom', event.target.innerText);

            $('#input-box').focus();
        }
    });

    Accounts.ui.config({
        passwordSignupFields: "USERNAME_ONLY"
    });
}
