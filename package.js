Package.describe({
    name: 'cesarve:simple-cms',
    version: '0.1.0',
    // Brief, one-line summary of the package.
    summary: 'Simple and easy content management system CMS for Meteor Apss',
    // URL to the Git repository containing the source code for this package.
    git: 'https://github.com/cesarve77/simple-cms',
    // By default, Meteor will default to using README.md for documentation.
    // To avoid submitting documentation, set this field to null.
    documentation: 'README.md'
});

Package.onUse(function (api) {
    api.versionsFrom('1.2.1');
    api.use(['ecmascript', 'templating','mongo','accounts-base']);
    api.addFiles(['my-image-uploder.js','simple-cms.html'],'client');
    api.addFiles('simple-cms.js');
    api.export('SimpleCMS')
});
