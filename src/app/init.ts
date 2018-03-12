// Semantic UI typings
interface JQuery<TElement extends Node = HTMLElement>
{
    dropdown(): void;
}

var app = angular.module('imagetilefun', []);

$(function()
{
    $('.ui.select').dropdown();
});