const AsMixin = Symbol('asMixin');

const { Mixin } = require('./mixins')
module.exports.Mixin = Mixin;

module.exports.Class = function(superclass, func) {
	const MixableType = performMixin(superclass, func);
	MixableType[AsMixin] = Mixin(func);
	return MixableType;
};

module.exports.toExtendable = function(type) {
    type.with = function(...mixins) {
        return mix(type, ...mixins);
	};
	return type;
};

function mix(base, ...mixins) {
	let root = base;
	let chain = root.name;
	for(let i=0; i<mixins.length; i++) {
		let mixin = mixins[i];

		if(! mixin) {
			throw new Error('Trying to apply non-existent mixin');
		}

		if(mixin[AsMixin]) {
			mixin = mixin[AsMixin];
		}

		if(! mixin) {
			throw new Error('Mixin implementation bug, resolved to non-existent mixin');
		}

		root = performMixin(root, mixin);
		chain = root.name + ' > ' + chain;
	}

	return root;
}

function performMixin(root, mixin) {
	const type = mixin(root);
	type.with = function(...mixins) {
		return mix(type, ...mixins);
	};
	return type;
}

module.exports.mix = mix;

