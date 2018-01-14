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
                $('span[name="status"]').text("Completed upload");
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
                $('span[name="status"]').text("Upload returned with an error! Check the console.");
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
    })
});