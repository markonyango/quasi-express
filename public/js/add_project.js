$(document).ready(function() {

    // Form evaluation stuff
    $('#type').on('change', function(event){
        const selected = $('#type option:selected').val();
        if(selected === 'dea'){
            $('#options_dea').show('fast','swing');
            $('input[name="qa_files"]').hide();
        } else {
            $('#options_dea').hide();
            $('input[name="qa_files"]').show('fast','swing');
            
        }
    });


    // Form submission handling
    $('#add_project_form').on('submit', function(event) {
        event.preventDefault();
        const form = $(this);
        var formData = false;

        if (window.FormData) {
            formData = new FormData(form[0]);
            console.log("FormData supported")
        }
        
        
        $.ajax({
            type:   'POST',
            url:    '/projects/upload',
            data:   formData ? formData : form.serialize,
            processData:    false,
            contentType:    false,

            beforeSend: function() {
                console.log("Starting to upload files");
            },
            complete: function() {
                console.log("Completed ajax request");
            },
            success: function(res) {
                console.log("Ajax request was successful",res);
                $('#exampleModal').modal('hide');
            },
            fail: function() {
                console.log("Ajax request failed");
            },
            error: function() {
                console.log("Ajax request returned with an error");
            }
        });
    })
});