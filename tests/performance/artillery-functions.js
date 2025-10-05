// Funciones personalizadas para Artillery
module.exports = {
    setAuthHeader
};

function setAuthHeader(context, events, done) {
    if (context.vars.auth_token) {
        context.vars.$headers = context.vars.$headers || {};
        context.vars.$headers.Authorization = `Bearer ${context.vars.auth_token}`;
    }
    return done();
}