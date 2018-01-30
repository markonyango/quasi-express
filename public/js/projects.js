$(document).ready(function () {

    // Form evaluation stuff
    $('select[name="projecttype"]').on('change', function (event) {
        const selected = $('select[name="projecttype"] option:selected').val();

        if (selected === 'dea') { $('#options_dea').show('fast', 'swing'); }
        else { $('#options_dea').hide(); }
    });


    // Form submission handling
    $('#add_project_form').on('submit', function (event) {
        event.preventDefault();

        const form = $(this);
        var formData = false;

        if (window.FormData) {
            formData = new FormData(form[0]);
        }

        $.ajax({
            type: 'POST',
            url: '/projects/upload',
            data: formData ? formData : form.serialize,
            processData: false,
            contentType: false,

            beforeSend: function () {
                $('.progress').parent().show();
                $('span[name="status"]').show();
                console.log("Starting to upload form data...");
                $('span[name="status"]').text("Starting to upload form data...");
            },
            complete: function () {
                console.log("Completed upload");
            },
            success: function (res) {
                console.log("Form data was successfully uploaded", res);
                $('#exampleModal').modal('hide');
                window.location = '/projects';
            },
            fail: function (res) {
                console.log(res);
                $('span[name="status"]').text("Upload failed! Check the console.");
            },
            error: function (res) {
                console.log(res);
                $('span[name="status"]').text(res.responseJSON.message);
            },
            xhr: function () {
                // get the native XmlHttpRequest object
                var xhr = $.ajaxSettings.xhr();
                // set the onprogress event handler
                xhr.upload.onprogress = function (evt) {
                    const progressbar = $('.progress-bar');
                    var progress = Math.round(evt.loaded / evt.total * 100);
                    progressbar.text(progress + '%');
                    progressbar.attr('aria-valuenow', progress);
                    progressbar.width(progress + '%');
                };
                // return the customized object
                return xhr;
            }
        });
    });

    // Starting and Stoping projects
    $('button[name="start_project"]').click(function() {
        const pid = $(this)[0].attributes.pid.value;
        
        $.ajax({
            type: 'PUT',
            url: '/projects/' + pid + '/start',
            dataType: 'json',

            success: function(...data) {
                // The server responds with 3 items in the data aray: 
                // the project object from the MongoDB, "success" and the response object
                const project = data[0];
                
                project.status === 'running' ? window.location = '/projects' : alert('Could not start project. Contact admin.');
            },
            error: function(error) {
                console.log('error: ', + error);
            },
            complete: function() {
                // console.log('complete: ', + data);
            }
        });
    });

    $('button[name="stop_project"]').click(function() {
        const pid = $(this)[0].attributes.pid.value;
        
        $.ajax({
            type: 'PUT',
            url: '/projects/' + pid + '/stop',
            dataType: 'json',

            success: function(...data) {
                // The server responds with 3 items in the data aray: 
                // the project object from the MongoDB, "success" and the response object
                const project = data[0];
                
                project.status === 'stopped' ? window.location = '/projects' : console.log('Could not stop project. Contact admin.' + JSON.stringify(data));
            },
            error: function(error) {
                console.log('error: ', + error);
            },
            complete: function() {
                // console.log('complete: ', + data);
            }
        });
    });

    $('button[name="remove_project"]').click(function() {
        const pid = $(this)[0].attributes.pid.value;
        
        $.ajax({
            type: 'PUT',
            url: '/projects/' + pid + '/remove',
            dataType: 'json',

            success: function(...data) {
                // The server responds with 3 items in the data aray: 
                // the project object from the MongoDB, "success" and the response object
                // data.forEach(item => console.log(item));
                const project = data[0];
                data.forEach(function(item) {
                    console.log(item)
                })
                
                project._id === pid && data[1] === 'success' ? window.location = '/projects' : alert('Could not remove project. Contact admin.');
            },
            error: function(error) {
                console.log('error: ', + error);
            },
            complete: function() {
                // console.log('complete: ', + data);
            }
        });
    });

});