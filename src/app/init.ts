// Semantic UI typings
interface JQuery<TElement extends Node = HTMLElement>
{
    dropdown(options?: any): void;
}

var app = angular.module('imagetilefun', []);

$(function()
{
    $('.ui.select.non-stick').dropdown({ action: 'hide' });
    $('.ui.select').not('.non-stick').dropdown();
});