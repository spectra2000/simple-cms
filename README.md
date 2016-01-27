# Simple Content Management System
### For Meteor Apps

## Quick Start
### Install:
    //in terminal
    $ meteor add cesarve:simple-cms
### Basic Usage:
    //in client template
    {{>SimpleCMS id="uniqueId"}}


## Features
* Cache result

    Templates are saved on file system.
    No subscriptions for read only users
* Configurable

    Build on top of getcontenttools.com
    You can config setting and style list
* Access Control

    Control who users can update content thru a custom function

## API
### SimpleCMS.voter property
Client and server side function.
On server return if is allowed to update content
On client return true to make regions editable or not

Receive 1 arguments:

userId: Current user Id
Example:


    //server, client or both
    SimpleCMS.voter=function(userId){
        return Roles.isUserInRole(userId,"role-admin")
    }
    // or custom logic
    SimpleCMS.voter=function(userId){
        if (Meteor.isClient)
            return Roles.isUserInRole(userId,"role-admin")
        else
            return isDemoSite() ? false : true
    }

## SimpleCMS.addStyle(title, selector, tags) method
Add existents styles for apply to contents. see [http://getcontenttools.com/getting-started#configure-styles]

Receive 3 arguments:

- Title: A title for show to user, like: "Author"
- Selector: selector of style, like: .class-name, #elementId
- Tags: array of tags to which can be apply

Example:

    //in client maybe in your Template onRender
    SimpleCMS.addStyle('Author','.author',['p','blockquote'])
    SimpleCMS.addStyle('Note','.note',['p'])
    SimpleCMS.addStyle('Big','.jumbo',['p','h1'])

    //in client styles.css
    .author{
       color: ##ff00ff;
    }
    .note{
       background-color: #f1f1f1;
    }
    .jumbo{
        border:1px solid #000;
        font-size: 36px
    }
    
## SimpleCMS.setConfig(key, value) method

Write or overwrite a key, value config see: http://getcontenttools.com/api/content-tools#settings

Example:

    //in client
    var defaultTools=[
            'bold',
            'italic',
            'link',
            'align-left',
            'align-center',
            'align-right'
        ]"
    SimpleCMS.setConfig("DEFAULT_TOOLS",defaultTools) 
    
    
> Note: if you overwrite "IMAGE_UPLOADER" you should implement your own solution

## Demo

[http://simplecms.meteor.com]
