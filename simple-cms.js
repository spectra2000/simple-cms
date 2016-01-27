class SimpleCms {
    constructor() {
        this._content = new Mongo.Collection('simplecmscontents')
        /**
         * function return if a doc can be edited
         * @params userId string
         * @type {function}
         * @private
         */
        this._voter = function (userId) {
            return true
        }
        if (Meteor.isClient) {
            /**
             * par key, values for config the contenttools
             * see: http://getcontenttools.com/api/content-tools#settings
             * @type {Object}
             */
            this.configs = {"IMAGE_UPLOADER": myImageUploader}
            /**
             * List of styles [title to show of style, style name, array  of tags can apply]
             * example ['Author','.autor',['p','div']]
             * @type {Array}
             */
            this.styles = []
            /**
             * allowed this.configs keys
             * @type {string[]}
             * @private
             */
            this._allowedConfigKeys = ['DEFAULT_TOOLS', 'DEFAULT_VIDEO_WIDTH, DEFAULT_VIDEO_HEIGHT', 'HIGHLIGHT_HOLD_DURATION', 'INSPECTOR_IGNORED_ELEMENTS', 'IMAGE_UPLOADER', 'MIN_CROP', 'RESTRICTED_ATTRIBUTES']
        }

    }

    /**
     * default content if not provide
     * @type {string}
     */
    static get defaultContent() {
        return '<h1>Please Edit !!!</h1><p>Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod tempor incididunt ut labore et dolore magna aliqua. Ut enim ad minim veniam, quis nostrud exercitation ullamco laboris nisi ut aliquip ex ea commodo consequat. Duis aute irure dolor in reprehenderit in voluptate velit esse cillum dolore eu fugiat nulla pariatur. Excepteur sint occaecat cupidatat non proident, sunt in culpa qui officia deserunt mollit anim id est laborum</p>'
    }

    /**
     * name of meteor subscription and publish
     * @returns {string}
     */
    static get pubSubName() {
        return 'SimpleCmsContents'
    }


    /**
     * Return result of voter fnc set by user
     * use to know when the content can be edited
     * for example user admin
     * @returns {boolean}
     */
    canEdit(userId) {
        return this._voter(userId)

    }

    /**
     * set custom voter function
     * @param fn
     */
    set voter(fn) {
        //console.log('setting voter', fn)
        if (typeof fn != "function") {
            throw new Meteor.Error('canEdit should to be a function')
        }
        this._voter = fn
    }

    /**
     * set key value config
     * see: http://getcontenttools.com/api/content-tools#settings
     * @param key
     * @param value
     */
    setConfig(key, value) {
        if (!key in allowedConfigKeys) {
            throw new Meteor.Error("SimpleCms config key ${key} is not supported, allowed values are " + allowedConfigKeys.join(', '))
        }
        this.configs[key] = value
    }

    /**
     * ContentTools styles
     * @param title String title of style
     * @param name String style, like .class #id
     * @param apply [String] array of tags to apply
     */
    addStyle(title, name, apply) {
        //console.log(title, name, apply)
        this.styles.push(new ContentTools.Style(title, name, apply))
    }

    get Contents() {
        return this._content
    }

}

SimpleCMS = new SimpleCms()

if (Meteor.isClient) {

    Template.SimpleCMS.onCreated(function () {
        Session.setDefault('SimpleCMS.created-template', 0)
        Session.setDefault('SimpleCMS.rendered-template', 0)
        Session.set('SimpleCMS.created-template', Session.get('SimpleCMS.created-template') + 1)

    })
    Template.SimpleCMS.onDestroyed(function () {
        Session.setDefault('SimpleCMS.created-template', 0)
        Session.setDefault('SimpleCMS.rendered-template', 0)
    })

    var activeEditor = ()=> {
        let editor
        for (let key in SimpleCMS.configs) {
            ContentTools[key] = SimpleCMS.configs[key]
        }

        for (let index in   SimpleCMS.styles) {
            let stylesList = ContentTools.StylePalette.styles()
            if (!_.indexOf(stylesList, SimpleCMS.styles[index]) >= 0)
                ContentTools.StylePalette.add(SimpleCMS.styles[index])
        }
        /**
         * init editor
         */
        editor = ContentTools.EditorApp.get();
        editor.init('*[data-editable]', 'data-id');
        editor.unbind('save')
        editor.bind('save', function (regions) {
            this.busy(true);
            Meteor.call('SimpleCMS.Save', regions, function (err, res) {
                editor.busy(false);
                if (err) {
                    console.log(err)
                    new ContentTools.FlashUI('no');
                }

                if (res) {
                    console.log(res)
                    new ContentTools.FlashUI('ok');
                }

            })
        });
        return editor
    }
    Template.SimpleCMS.onRendered(function () {
            Session.set('SimpleCMS.rendered-template', Session.get('SimpleCMS.rendered-template') + 1)
            let editor;
            let sub
            this.autorun(()=> {
                if (SimpleCMS.canEdit(Meteor.userId()))
                    sub=this.subscribe(SimpleCms.pubSubName, this.data.id)
                //If is the last  SimpleCMS template rendered
                if (Session.get('SimpleCMS.created-template') == Session.get('SimpleCMS.rendered-template')) {
                    //on login
                    if (SimpleCMS.canEdit(Meteor.userId()))
                        Meteor.setTimeout(()=> {
                            console.log('edit mode')
                            editor=activeEditor()
                        }, 100)

                    //on logout
                    if (!SimpleCMS.canEdit(Meteor.userId()) && editor)
                        editor.destroy()
                }
            })
            this.autorun(()=> {
                if (this.subscriptionsReady() && sub && sub.ready()){

                    let content = SimpleCMS.Contents.findOne(this.data.id)
                    console.log('content', this,content,sub)
                    if (!content) {
                        Meteor.call('SimpleCMS.New', this.data.id, this.data.html)
                    }
                }

                //Meteor.call('SimpleCMS.New', this.data.id, this.data.html)
            })


        }
    )
    Template.SimpleCMS.helpers({
        html: function () {
            console.log('Template.SimpleCMS.helpers', this.id)
            let content = SimpleCMS.Contents.findOne(this.id)

            if (content) {
                return content.html
            }
            return 'loading'
        },
        canEdit: function () {
            return SimpleCMS.canEdit(Meteor.userId())
        }
    })
}
if (Meteor.isServer) {

    saveFile = function (blob, id, path, encoding) {
        var fs = Npm.require('fs');
            id = cleanName(id || 'file'), encoding = encoding || 'binary',
            chroot = process.env.PWD || 'public';
        // Clean up the path. Remove any initial and final '/' -we prefix them-,
        // any sort of attempt to go to the parent directory '..' and any empty directories in
        // between '/////' - which may happen after removing '..'

        path = chroot + (path ? '/' + path + '/' : '/');
        fs.existsSync(path) || fs.mkdirSync(path);

        fs.writeFile(path + id, blob, encoding, function (err) {
            console.log(err)
            if (err) {
                throw new Meteor.Error(500, 'Failed to save file.', err);
            } else {
                console.log('The file ' + id + ' (' + encoding + ') was saved to ' + path);
            }
        });


        function cleanName(str) {
            return str.replace(/\.\./g, '').replace(/\//g, '');
        }
    }
    Meteor.publish(SimpleCms.pubSubName, function (_id) {
        return SimpleCMS.Contents.find({_id})
    })

    SimpleCMS.Contents.allow({
        'insert': function (userId) {
            return SimpleCms.canEdit(userId)
        },
        'update': function (userId) {
            return SimpleCms.canEdit(userId)
        }
    })


    Meteor.methods({
        'SimpleCMS.New': function (_id) {
            if (!SimpleCMS.canEdit(this.userId))
                throw new Meteor.Error(403, "Access forbidden")
            SimpleCMS.Contents.insert({_id, html: SimpleCms.defaultContent })
        },
        'SimpleCMS.Save': function (regions) {
            this.unblock()
            for (_id in regions) {
                if (!SimpleCMS.canEdit(this.userId))
                    throw new Meteor.Error(403, "Access forbidden")
                let html = regions[_id]
                SimpleCMS.Contents.upsert({_id}, {$set: {html}})
                html = html.replace('{{', '&#123;&#123;')
                let body = '<template name="' + _id + '">' + html + '</template>'
                saveFile(body, _id + '.html', 'client/cache', 'utf8')
            }

            return true
        }
    })
}