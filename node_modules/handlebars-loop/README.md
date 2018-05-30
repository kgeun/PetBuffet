# Handlebars Loop
Handlebars helper that iterates through a range of numbers.

## Usage
```javascript
{{#loop 0 5 1}}
<div>{{this}}</div>
{{/loop}}
```
Should output

```html
<div>0</div>
<div>1</div>
<div>2</div>
<div>3</div>
<div>4</div>
<div>5</div>
```

## Parameters

| Argument	| Type 		| Description								|
|:----------|:----------|:------------------------------------------|
| from		| Number 	| The number to start iterating from.		|
| to 		| Number 	| The number to stop iterating at. 			|
| increase	| Number 	| The number to increase by per iteration 	|
