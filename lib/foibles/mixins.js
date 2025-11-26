const { decorate, apply, has } = require('./decoration');

function root(mixin) {
	return decorate(mixin, superclass => apply(superclass, mixin));
}
module.exports = root;

function deduplication(mixin) {
	return decorate(mixin, superclass => {
		if(has(superclass.prototype, mixin)) {
			return superclass;
		}

		return mixin(superclass);
	});
}

function hasInstance(mixin) {
	if(Symbol.hasInstance && ! mixin.hasOwnProperty(Symbol.hasInstance)) {
		Object.defineProperty(mixin, Symbol.hasInstance, {
			value: function mixinHasInstance(other) {
				return has(other, mixin);
			}
		});
	}

	mixin.isInstance = function(other) {
		return has(other, mixin);
	};
	return mixin;
}

function mixin(func) {
	return deduplication(root(hasInstance(func)));
}

module.exports.Mixin = mixin;

