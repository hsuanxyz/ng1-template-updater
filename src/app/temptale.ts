export const TEMPLATE = `
<div ng-class="{active: isActive}"></div>
<div ng-class="{active: isActive,
                shazam: isImportant}"></div>
<img ng-src="{{movie.imageurl}}">
<div ng-style="{color: colorPreference}"></div>
<a ng-href="{{ angularDocsUrl }}">Angular Docs</a>
<a ng-href="#{{ moviesHash }}">Movies</a>

<h3 ng-show="vm.favoriteHero">
  {{vm.value}}
  Your favorite hero is: {{vm.favoriteHero}}
</h3>

<input ng-model="value"/>
<button ng-click="toggleImage()" nzClass></button>
<button ng-click="toggleImage($event)"></button>
<button ng-foucs="fun($event)"></button>

<div>{{value | limitTo:2:0}}</div>
<div>{{value | currency}}</div>
<div>{{value | currency: '$USD': 2}}</div>
<div>{{value | currency: '$USD'}}</div>
<div>{{ | value }}</div>
<div>{{'value | string: arg1: arg2'}}</div>
<div>
 {{ value | pipe1: 'arg1': 1: false
 | currency : '$USD'
 | pipe3: arg1: arg2: arg3
 | pipe4 }}
</div>
<div>{{ [1,2,3,4,5] | limit: 0: 2 }}</div>
<div>{{ (value + 2) | number: '1-2' }}</div>

<table ng-if="movies.length">
  <tr ng-repeat="movie in movies">
    <td>{{movie.title}}</td>
  </tr>
  <tr ng-repeat="movie in movieList | limitTo:2:0"></tr>
</table>

<div ng-switch="favoriteHero &&
                checkMovieHero(favoriteHero)">
    <div ng-switch-when="true">
      Excellent choice!
    </div>
    <div ng-switch-when="false">
      No movie, sorry!
    </div>
</div>`;
