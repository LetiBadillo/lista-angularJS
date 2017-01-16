
var app = angular.module('books', ['ui.router']);

app.config([
'$stateProvider',
'$urlRouterProvider',
function($stateProvider, $urlRouterProvider) {

  $stateProvider
    .state('home', {
  url: '/home',
  templateUrl: '/home.html',
  controller: 'MainCtrl',
  resolve: {
    postPromise: ['posts', function(posts){
      return posts.getAll();
    }]
  }
}).state('posts', {
  url: '/posts/{id}',
  templateUrl: '/posts.html',
  controller: 'PostsCtrl',
  resolve: {
    post: ['$stateParams', 'posts', function($stateParams, posts) {
      return posts.get($stateParams.id);
    }]
  }
}).state('login', {
  url: '/login',
  templateUrl: '/login.html',
  controller: 'AuthCtrl',
  onEnter: ['$state', 'auth', function($state, auth){
    if(auth.isLogged()){
      $state.go('home');
    }
  }]
})
.state('register', {
  url: '/register',
  templateUrl: '/register.html',
  controller: 'AuthCtrl',
  onEnter: ['$state', 'auth', function($state, auth){
    if(auth.isLogged()){
      $state.go('home');
    }
  }]
});

}]);

app.factory('auth', ['$http', '$window', function($http, $window){

var auth = {};

auth.saveT = function (token){
  $window.localStorage['lista-libros-token'] = token;
};

auth.getT = function (){
  return $window.localStorage['lista-libros-token'];
}

auth.isLogged = function(){
  var token = auth.getT();

  if(token){
    var payload = JSON.parse($window.atob(token.split('.')[1]));

    return payload.exp > Date.now() / 1000;
  } else {
    return false;
  }
};

auth.usuario = function(){
  if(auth.isLogged()){
    var token = auth.getT();
    var payload = JSON.parse($window.atob(token.split('.')[1]));

    return payload.username;
  }
};  

auth.register = function(user){
  return $http.post('/register', user).success(function(data){
    auth.saveT(data.token);
  });
};

auth.logIn = function(user){
  return $http.post('/login', user).success(function(data){
    auth.saveT(data.token);
  });
};

auth.logOut = function(){
  $window.localStorage.removeItem('lista-libros-token');
};
  return auth;
}])

.factory('posts', ['$http', 'auth', function($http, auth){
  var o = {
    posts: []
  };
  o.get = function(id) {
  return $http.get('/posts/' + id).then(function(res){
    return res.data;
  });
};
   o.getAll = function() {
    return $http.get('/posts').success(function(data){
      angular.copy(data, o.posts);
    });
  };

o.create = function(post) {
  return $http.post('/posts', post, {
    headers: {Authorization: 'Bearer '+auth.getT()}
  }).success(function(data){
    o.posts.push(data);
  });
};

o.upvote = function(post) {
  return $http.put('/posts/' + post._id + '/upvote')
    .success(function(data){
      post.upvotes += 1;
    });
};

o.deletePost = function(post) {  
  return $http.put('/posts/' + post._id + '/delete')
    .success(function(data){

      var index = o.posts.indexOf(data);
      o.posts.splice(index, 1);
    });
};

o.savePost = function(post) {
  return $http.put('/posts/' + post._id +'/edit', post, {
    headers: {Authorization: 'Bearer '+auth.getT()}
  });
};

  return o;
}]);


app.controller('MainCtrl', [
'$scope',
'posts', 'auth',
function($scope, posts, auth){
	$scope.posts = posts.posts;
  $scope.isLogged = auth.isLogged;
$scope.addPost = function(){

  if(!$scope.title || $scope.title === '') { return; }
  posts.create({
    title: $scope.title,
    link: $scope.link,
    genero: $scope.genero,
  });
  $scope.title = '';
  $scope.link = '';
  $scope.genero = '';
};

$scope.incrementUpvotes = function(post) {
  posts.upvote(post);
};

$scope.deletePost = function(post){
  posts.deletePost(post);

};
//Manda el post al modal
$scope.editPost = function(post) {
       angular.element(document.getElementById("modalsave")).scope().post = post;
    };
//Almacena los cambios en la BD
$scope.save = function(post) {
       posts.savePost(post);
    };

}]);

app.controller('PostsCtrl', ['$scope','posts','post', 'auth',
function($scope, posts, post, auth){
  $scope.post = post;
  $scope.isLogged = auth.isLogged;


}])
.controller('AuthCtrl', [
'$scope',
'$state',
'auth',
function($scope, $state, auth){
  $scope.user = {};

  $scope.register = function(){
    auth.register($scope.user).error(function(error){
      $scope.error = error;
    }).then(function(){
      $state.go('home');
    });
  };

  $scope.logIn = function(){
    auth.logIn($scope.user).error(function(error){
      $scope.error = error;
    }).then(function(){
      $state.go('home');
    });
  };
}])
.controller('NavCtrl', [
'$scope',
'auth',
function($scope, auth){
  $scope.isLogged = auth.isLogged;
  $scope.usuario = auth.usuario;
  $scope.logOut = auth.logOut;
}]);
 