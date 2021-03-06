import $ from '../util/dom-core';

/**
 * 控制栏按钮的操作类
 */
class Button{
	constructor(editor){
		this._editor = editor;
		this._buttonList = {};
		this._$lastWrap = void 0;
	}

	/**
	 * addButton - 挂载按钮，按照配置顺序统一渲染
	 * 
	 * @param {Object} opts 按钮参数，包含title|icon|name|id
	 * @return {type}  description
	 */
	addButton(opts){
		if(!opts || !opts.name) return this;
		this._buttonList[opts.name.trim()] = opts;
		return this;
	}

	/**
	 * 渲染单个按钮到控制栏
	 * @param  {string} name [按钮名]
	 * @return {undefined|element} 按钮VE实例
	 */
	render(name){
		if (!this._editor.$toolbar) throw new Error('未发现 toolbar 元素，无法添加按钮！');
		if (!this._$lastWrap) this._$lastWrap = this._insertWrap();

		name = name.trim();

		if(name === '|') {
			this._split();
		} else if (name === '-') {
			this._$lastWrap = this._insertWrap();
		} else if (this._buttonList[name]) {
			const $button = this._renderButton(this._buttonList[name]);
			this._$lastWrap.append($button);
			return $button;
		}
	}

	getMenuBtn(name) {
		return this._editor.$toolbar.find('.oh-button-wrap').find(`.oh-btn-${name.trim()}`);
	}

	/**
	 * _renderButton - 生成一个按钮元素
	 *
	 * @private
	 * @return {$button} description
	 */
	_renderButton(btnOpts){
		let $button = $(`
			<button type="button" id="oh-btn-${btnOpts.id}" class="oh-menu oh-btn-${btnOpts.name}" title="${btnOpts.title}">
				<span class="fa fa-${btnOpts.icon}"></span>
			</button>
		`);

		if(btnOpts.type === 'drop'){
			$button.addClass('oh-drop');
			$button.data('popup', `oh-drop-${btnOpts.id}`);
		}else if(btnOpts.type === 'popup'){
			$button.addClass('oh-popup');
			$button.data('popup', `oh-popup-${btnOpts.id}`);
		}else{
			/*普通命令按钮直接绑定命令操作*/
			$button.addClass('oh-cmd-btn');
			$button.data('cmd', btnOpts.cmd);
			btnOpts.cmdParam && $button.data('param', btnOpts.cmdParam);
		}

		return $button;
	}

	/**
	 * 内置，插入新容器以换行
	 * 
	 * @private
	 * @return {element} 最后面的容器
	 */
	_insertWrap(){
		let $div = $('<div class="clearfix oh-button-wrap"></div>');

		this._editor.$toolbar.append($div);
		return $div;
	}

	/**
	 * 内置，分隔符
	 * @return {Button} 实例
	 */
	_split(){
		let $span = $('<span class="oh-split"></span>');
		this._$lastWrap.append($span);
		return $span;
	}
}

export { Button };
