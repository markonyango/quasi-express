$(document).ready(function () {

    // Was Alignment reference list loaded already? Null if no, array if yes.
    let references = null;

    // Form evaluation stuff
    $('select[name="projecttype"]').on('change', function (event) {
        const selected_projecttype = $('select[name="projecttype"] option:selected').val();

        if (selected_projecttype === 'dea') { 
            $('#options_dea').show('fast', 'swing');
        }
        else { 
            $('#options_dea').hide();
        }

        if (selected_projecttype === 'align') {
            if (!references) {
                fetch('/projects/references', { credentials: 'include' })
                    .then(res => res.json())
                    .then(res => {
                        references = res;
                        let referenceSelect = $('select[name="settings[reference]"]');
                        $.each(references, function(i,item) {
                            referenceSelect.append($('<option>', {
                                value: item,
                                text: item
                            }));
                        });
                        $('#options_align').show('fast', 'swing');
                    })
                    .catch(error => console.log(error));
            } else {
                $('#options_align').show('fast', 'swing');
            }
        } else {
            $('#options_align').hide();
        }
    });


    // Form submission handling
    $('#add_project_form').on('submit', function (event) {
        event.preventDefault();

        const form = $(this);
        var formData = new FormData(form[0]);

        fetch('/projects/upload', { body: formData, method: 'POST', credentials: 'include' })
            .then(res => res.json())
            .then(res => {
                console.log("Form data was successfully uploaded", res);
                $('#exampleModal').modal('hide');
                window.location = '/projects';
            })
            .catch(error => {
                console.log(error);
                $('span[name="status"]').text("Upload failed! Check the console.");
            });
    });

    // Starting and Stoping projects
    $('button[name="start_project"]').click(function () {
        const pid = $(this)[0].attributes.pid.value;

        $.ajax({
            type: 'PUT',
            url: '/projects/' + pid + '/start',
            dataType: 'json',

            success: function (...data) {
                // The server responds with 3 items in the data aray: 
                // the project object from the MongoDB, "success" and the response object
                const project = data[0];

                project.status === 'running' ? window.location = '/projects' : alert('Could not start project. Contact admin.');
            },
            error: function (error) {
                console.log('error: ', + error);
            },
            complete: function () {
                // console.log('complete: ', + data);
            }
        });
    });

    $('button[name="stop_project"]').click(function () {
        const pid = $(this)[0].attributes.pid.value;

        $.ajax({
            type: 'PUT',
            url: '/projects/' + pid + '/stop',
            dataType: 'json',

            success: function (...data) {
                // The server responds with 3 items in the data aray: 
                // the project object from the MongoDB, "success" and the response object
                const project = data[0];

                project.status === 'stopped' ? window.location = '/projects' : console.log('Could not stop project. Contact admin.' + JSON.stringify(data));
            },
            error: function (error) {
                console.log('error: ', + error);
            },
            complete: function () {
                // console.log('complete: ', + data);
            }
        });
    });

    $('button[name="remove_project"]').click(function () {
        const pid = $(this)[0].attributes.pid.value;

        $.ajax({
            type: 'PUT',
            url: '/projects/' + pid + '/remove',
            dataType: 'json',

            success: function (...data) {
                // The server responds with 3 items in the data aray: 
                // the project object from the MongoDB, "success" and the response object
                // data.forEach(item => console.log(item));
                const project = data[0];
                data.forEach(function (item) {
                    console.log(item)
                })

                project._id === pid && data[1] === 'success' ? window.location = '/projects' : alert('Could not remove project. Contact admin.');
            },
            error: function (error) {
                console.log('error: ', + error);
            },
            complete: function () {
                // console.log('complete: ', + data);
            }
        });
    });

});