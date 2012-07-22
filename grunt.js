var spawn = require('child_process').spawn;

function run(exe, args, callback){
    var process = spawn(exe, args, {stdio: 'inherit'});

    process.on('exit', function(code){
        callback(code);
    });
}

module.exports = function(grunt) {
    // Project configuration.
    grunt.initConfig({
        pkg: '<json:package.json>'
    });

    grunt.registerTask('lint', function(){
        var done = this.async();

        run('jshint', ['.'], function(code){
            if(code){
                return grunt.fatal('jshint failed');
            }
            done();
        });
    });

    grunt.registerTask('test', function(){
        var done = this.async();

        run('mocha', [], function(code){
            if(code){
                return grunt.fatal('mocha failed');
            }
            done();
        });
    });

    // Default task.
    grunt.registerTask('default', 'lint test');

};