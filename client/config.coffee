exports.config =

    # See http://brunch.readthedocs.org/en/latest/config.html for documentation.
    paths:
        public: 'public'
        test: '_specs'

    plugins:
        coffeelint:
            options:
                indentation: value:4, level:'error'

    conventions:
        vendor: /(vendor)|(_specs)(\/|\\)/ # do not wrap tests in modules
    files:
        javascripts:
            defaultExtension: 'coffee'
            joinTo:
                'javascripts/app.js': /^app/
                'javascripts/vendor.js': /^vendor/
            order:
                before: [
                    # Backbone
                    'vendor/jquery-1.9.1.js',
                    'vendor/underscore-1.5.1.js',
                    'vendor/backbone-1.0.0.js'
                ]
                after: [
                ]
        stylesheets:
            defaultExtension: 'styl'
            joinTo:
                'stylesheets/app.css': /^app/
                'stylesheets/vendor.css': /^vendor/
            order:
                before: [
                    'vendor/styles/bootstrap.css'
                    'vendor/styles/bootstrap-responsive.css',
                ]
                after: []
        templates:
            defaultExtension: 'jade'
            joinTo: 'javascripts/app.js'
    framework: 'backbone'
