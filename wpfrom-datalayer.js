(function() {
    // Ajax Form
    var ajaxForm = document.querySelectorAll('form.wpforms-ajax-form');
    if(ajaxForm.length) {
        var origXMLHttpRequest = XMLHttpRequest;
        XMLHttpRequest = function() {
            var requestURL;
            var requestMethod;
            var requestBody;

            var xhr = new origXMLHttpRequest();
            var origOpen = xhr.open;
            var origSend = xhr.send;

            xhr.open = function(method, url) {
                requestURL = url;
                requestMethod = method;
                return origOpen.apply(this, arguments);
            };

            xhr.send = function(data) {
                if (/.+\/admin-ajax\.php/.test(requestURL)) {
                    xhr.addEventListener('load', function() {
                        if (xhr.readyState === 4) {
                            if (xhr.status === 200) {
                                var response = JSON.parse(xhr.responseText);

                                if (response.success && (data instanceof FormData)) {
                                    requestBody = {};
                                    data.forEach(function(value, key) {
                                        if(key) {
                                            key = key.replace(/\[|\]/g, '_').replace(/_+/g, '_').replace(/^_|_$/g, '');
                                            requestBody[key] = value;
                                        }
                                    });

                                    if(requestBody.action === "wpforms_submit") {
                                        window.dataLayer = window.dataLayer || [];
                                        var wpFormData = Object.assign({}, requestBody);
                                        delete wpFormData['wpforms_nonce'];
                                        dataLayer.push({
                                            event: 'wpform_submit',
                                            formId: wpFormData['wpforms_id'],
                                            inputs: wpFormData
                                        });
                                    }
                                }
                            }
                        }
                    });
                }

                return origSend.apply(this, arguments);
            };

            return xhr;
        };
    }

    // Non Ajax Form
    var forms = document.querySelectorAll('form[id^="wpforms-form-"]:not(.wpforms-ajax-form)');
    forms.forEach(function(form) {
        var formId = form.getAttribute('data-formid');

        form.addEventListener('submit', function(event) {

            event.preventDefault();

            var form = this;
            var formData = new FormData(this);
            var wpFormData = {};

            var errorRequired = false;

             formData.forEach(function (value, key) {
                if(key) {
                    var inputField = form.querySelector('[name="'+key+'"]');

                    if(inputField) {
                        var fieldType = inputField.getAttribute('type');

                        var isRequiredField = inputField.classList.contains('wpforms-field-required');

                        if(isRequiredField) {
                            if(inputField.tagName === 'SELECT') {
                                var selectedOptionVal = inputField.options[inputField.selectedIndex].text;
                                if(!selectedOptionVal) {
                                    errorRequired = true;
                                }
                            } else if((inputField.getAttribute('type') === 'email') && (!value || !value.includes('@'))) {
                                 errorRequired = true;
                            }
                            else if(!value) {
                                errorRequired = true;
                            }
                        }
                    }

                    var formattedKey = key.replace(/\[|\]/g, '_').replace(/_+/g, '_').replace(/^_|_$/g, '');
                    wpFormData[formattedKey] = value;
                }
             });

             // required checkbox and radio button check 
             var requiredFieldSets = form.querySelectorAll('ul.wpforms-field-required');
             requiredFieldSets.forEach(function(fieldSet){
                if(fieldSet.querySelector('input[type="radio"]') || fieldSet.querySelector('input[type="checkbox"]')) {
                   if(!fieldSet.querySelector('input:checked')) {
                     errorRequired = true;
                   }
                }
             });   

            if(!errorRequired) {
                window.dataLayer = window.dataLayer || [];
                delete wpFormData['wpforms_nonce'];
                dataLayer.push({event: 'wpform_submit', formId: formId, inputs: wpFormData});
            }

        });
    });
})();
