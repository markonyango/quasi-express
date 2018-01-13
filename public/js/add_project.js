$(document).ready(function () {

    // Form evaluation stuff

    $('select[name="type"]').on('change', function (event) {
        const selected = $('select[name="type"] option:selected').val();
        console.log(selected);
        if (selected === 'dea') {
            $('#options_dea').show('fast', 'swing');
            $('#qa_files').hide();
        } else {
            $('#options_dea').hide();
            $('#qa_files').show('fast', 'swing');

        }
    });


    // Form submission handling
    $('#add_project_form').on('submit', function (event) {
        event.preventDefault();

        const form = $(this);
        var formData = false;

        if (window.FormData) {
            formData = new FormData(form[0]);
            console.log("FormData supported")
        }


        $.ajax({
            type: 'POST',
            url: '/projects/upload',
            data: formData ? formData : form.serialize,
            processData: false,
            contentType: false,

            beforeSend: function () {
                console.log("Starting to upload files");
                $('.progress-bar').parent().show();                
            },
            complete: function () {
                console.log("Completed ajax request");
            },
            success: function (res) {
                console.log("Ajax request was successful", res);
                $('#exampleModal').modal('hide');
            },
            fail: function (res) {
                console.log("Ajax request failed", res);
            },
            error: function (res) {
                console.log("Ajax request returned with an error", res);
            },
            xhr: function () {
                // get the native XmlHttpRequest object
                var xhr = $.ajaxSettings.xhr();
                // set the onprogress event handler
                xhr.upload.onprogress = function (evt) {
                    const progressbar = $('.progress-bar');
                    var progress = Math.round(evt.loaded / evt.total * 100);
                    progressbar.text(progress + '%');// = progress + '%';
                    progressbar.attr('aria-valuenow',progress);
                    progressbar.width(progress + '%');
                };
                // return the customized object
                return xhr;
            }
        });
    })
});