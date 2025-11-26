const reference = Symbol('decorator:ref');
const application = Symbol('decorator:application');

module.exports.decorate = function decorate(mixin, decorator) {
	Object.setPrototypeOf(decorator, mixin);
	if(! mixin[reference]) {
		mixin[reference] = mixin;
	}
	return decorator;
};

function original(mixin) {
	return mixin[reference] || mixin;
}
module.exports.original = original;

module.exports.apply = function apply(superclass, mixin) {
	const result = mixin(superclass);
	result.prototype[application] = original(mixin);
	return result;
};

module.exports.has = function has(object, mixin) {
	const originalMixin = original(mixin);
	while(object != null) {
		if(object.hasOwnProperty(application) && object[application] == originalMixin) {
			return true;
		}

		object = Object.getPrototypeOf(object);
	}

	return false;
};

