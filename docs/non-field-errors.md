# Non field errors


By default, Django REST Framework stores non field errors in a key named 'non_field_errors'
whenever there is a validation error (HTTP status 400).
Django REST Framework allows to customize the name of this key.

If you changed the default value, you will need to [extend](extending.md) the adapter and set
`nonFieldErrorsKey` in `app/adapters/application.js`:

```js
// app/adapters/application.js

import DRFAdapter from './drf';

export default DRFAdapter.extend({
  nonFieldErrorKey: 'my_key_name_is_waaay_cooler'
});
```

In the case of an InvalidError being raised by the adapter when the response contains non-field errors, the
adapter will include in the errors array a jsonapi error object of the form:

```js
{ detail: 'error 1', meta { key: 'non_field_errors' } }  //or whatever key name you configured
```

In case of several errors, the InvalidError.errors attribute will include

```js
{ detail: 'error 1', meta { key: 'non_field_errors' } }  //or whatever key name you configured
{ detail: 'error 2', meta { key: 'non_field_errors' } }  //or whatever key name you configured
```

     **note** we store the key for non-fiel errors in a meta object as this is non standard information
     that can be included in the error object defined by the jsonapi spec
