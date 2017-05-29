
EssayCtrl.$inject = ["fire", "$rootScope", "AuthFactory"];
PhrasesCtrl.$inject = ["fire", "$rootScope", "AuthFactory"];
StatisticsCtrl.$inject = ["fire", "$rootScope", "AuthFactory", "$scope"];
WordsCtrl.$inject = ["fire", "$rootScope", "AuthFactory"];
NavbarCtrl.$inject = ["$rootScope", "$state", "AuthFactory", "$location"];
AuthFactory.$inject = ["$firebaseAuth"];
fire.$inject = ["$log", "$firebaseObject", "$firebaseArray", "$rootScope", "AuthFactory"];$.material.init();

angular
    .module('further', [
        'ui.router',
        'wysiwyg.module',
        'chart.js',
        'further.Navbar',
        'further.Words',
        'further.Essay',
        'further.Phrases',
        'further.Statistics',
        'further.fire.service',
        'further.auth.factory'
    ])
    .config(config);

function config($stateProvider, $urlRouterProvider, $locationProvider) {
    // $locationProvider.html5Mode(true);
    
    $urlRouterProvider.otherwise('/');

    $stateProvider
        .state('/', {
            url: '/',
            templateUrl: 'app/components/start.html'
        })
        .state('words', {
            url: '/words',
            templateUrl: 'app/components/words.html',
            controller: 'WordsCtrl',
            controllerAs: 'vm'
        })
        .state('essay', {
            url: '/essay',
            templateUrl: 'app/components/essay.html',
            controller: 'EssayCtrl',
            controllerAs: 'vm'
        })
        .state('phrases', {
            url: '/phrases',
            templateUrl: 'app/components/phrases.html',
            controller: 'PhrasesCtrl',
            controllerAs: 'vm'
        })
        .state('statistics', {
            url: '/statistics',
            templateUrl: 'app/components/statistics.html',
            controller: 'StatisticsCtrl',
            controllerAs: 'vm'
        });
}

angular.module('further.Essay', [])
    .controller('EssayCtrl', EssayCtrl);

function EssayCtrl(fire, $rootScope, AuthFactory) {
    var vm = this;

    vm.showNewEssayForm = false;
    vm.essayName = '';
    vm.essayText = '';
    vm.essayNotSavedErrorMsg = false;
    vm.essayEmptyErrorMsg = false;
    vm.essayCurrentNotSavedErrorMsg = false;
    vm.essayCurrentEmptyErrorMsg = false;
    vm.essaysList = [];

    vm.cancelNewEssay = function() {
        vm.essayName = '';
        vm.essayText = '';
        vm.showNewEssayForm = false;
        vm.essayNotSavedErrorMsg = false;
        vm.essayEmptyErrorMsg = false;
    }

    vm.addNewEssay = function() {
        var date = new Date();
        var month = date.getMonth() + 1;
        if (month < 10) {
            month = '0' + month;
        }
        var created = date.getDate() + '.' + month + '.' + date.getFullYear();

        if (vm.essayName && vm.essayText) {
            if (fire.addNewEssay(vm.essayName, vm.essayText, created)) {
                vm.cancelNewEssay();
            } else {
                vm.essayNotSavedErrorMsg = true;
                vm.essayEmptyErrorMsg = false;
            }
        } else {
            vm.essayNotSavedErrorMsg = false;
            vm.essayEmptyErrorMsg = true;
        }
    };

    vm.saveCurrentEssay = function(essay) {
        if (essay.essayName && essay.essayText) {
            vm.essaysList.$save(essay).then({}, function(){
                vm.essayCurrentNotSavedErrorMsg = true;
                vm.essayCurrentEmptyErrorMsg = false;
            });
        } else{
            vm.essayCurrentNotSavedErrorMsg = false;
            vm.essayCurrentEmptyErrorMsg = true;
        }
    };

    vm.deleteEssay = function(essay) {
        vm.essaysList.$remove(essay).then(function() {
            if (!vm.essaysList.length) {
                vm.showNewEssayForm = true;
            }
        });
    };

    fire.getAllEssays().then(function(_d) {
        vm.essaysList = _d;

        if (vm.essaysList.length) {
            vm.showNewEssayForm = false;
        } else {
            vm.showNewEssayForm = true;
        }
    });

    vm.numberOfWords = function(string) {
        var tmp = document.createElement("div");
        tmp.innerHTML = string;
        var onlyText = tmp.textContent || tmp.innerText || "";

        if (onlyText.length) {
            return onlyText.split(' ').length;
        }

        return 0;
    }
    vm.numberOfCharacters = function(string) {
        var tmp = document.createElement("div");
        tmp.innerHTML = string;
        var onlyText = tmp.textContent || tmp.innerText || "";

        return onlyText.length;
    }
}

angular.module('further.Phrases', [])
    .controller('PhrasesCtrl', PhrasesCtrl);

function PhrasesCtrl(fire, $rootScope, AuthFactory) {
    var vm = this;
    vm.auth = AuthFactory;
    vm.newPhrase = '';
    vm.newPhraseDescription = '';
    vm.phrasesList = [];
    
    vm.addNewPhrase = function() {
        if (vm.newPhrase) {
            var date = new Date();
            var month = date.getMonth() + 1;
            if (month < 10) {
                month = '0' + month;
            }
            var created = date.getDate() + '.' + month + '.' + date.getFullYear();

            if (fire.addNewPhrase(vm.newPhrase, vm.newPhraseDescription, created)){
                vm.newPhrase = '';
                vm.newPhraseDescription = '';
            }
        } else{
            vm.phraseNotSavedErrorMsg = false;
            vm.phraseEmptyErrorMsg = true;
        }
    };

    vm.saveCurrentPhrase = function(phrase) {
        if (phrase.phrase) {
            vm.phrasesList.$save(phrase);
        }
    };

    fire.getAllPhrases().then(function(_d) {
        vm.phrasesList = _d;
    });
}
angular.module('further.Statistics', [])
    .controller('StatisticsCtrl', StatisticsCtrl);

function StatisticsCtrl(fire, $rootScope, AuthFactory, $scope) {
    var vm = this;
    vm.auth = AuthFactory;
    vm.wordsList = [];
    vm.numberOfWords = 0;
    vm.wordsLabels = [];
    vm.wordsValues = [];

    vm.essaysList = [];
    vm.numberOfEssays = 0;
    vm.essaysLabels = [];
    vm.essaysValues = [];

    vm.numberOfWordsUsedInEssays = 0;
    vm.pieData = [];
    vm.pieLabels = ["Total amount", "Used in essays"];

    fire.getAllWords().then(function(_d) {
        vm.wordsList = _d;
        vm.numberOfWords = vm.wordsList.length;

        var months = [];
        for (var i = 0; i < vm.numberOfWords; i++) {
            var monthAndYear = vm.wordsList[i].created.substring(3);
            var existedMonthIndex = findValueInArraysObject(months, monthAndYear);

            if (existedMonthIndex >= 0) {
                months[existedMonthIndex].number += 1;
            } else {
                var monthObj = {
                    value: monthAndYear,
                    number: 1
                }

                months.push(monthObj);
            }
        }

        var sortedMonthsArr = sortMonthsArrayAscending(months);
        if (sortedMonthsArr.length > 12) {
            sortedMonthsArr = sortedMonthsArr.slice(-12);
        }
        sortedMonthsArr.forEach(function(item) {
            vm.wordsLabels.push(item.value);
        });
        sortedMonthsArr.forEach(function(item) {
            vm.wordsValues.push(item.number);
        });

        
    });

    fire.getAllEssays().then(function(_d) {
        vm.essaysList = _d;
        vm.numberOfEssays = vm.essaysList.length;

        var months = [];
        for (var i = 0; i < vm.numberOfEssays; i++) {
            var monthAndYear = vm.essaysList[i].created.substring(3);
            var existedMonthIndex = findValueInArraysObject(months, monthAndYear);

            if (existedMonthIndex >= 0) {
                months[existedMonthIndex].number += 1;
            } else {
                var monthObj = {
                    value: monthAndYear,
                    number: 1
                }

                months.push(monthObj);
            }
        }

        var sortedMonthsArr = sortMonthsArrayAscending(months);
        if (sortedMonthsArr.length > 12) {
            sortedMonthsArr = sortedMonthsArr.slice(-12);
        }
        sortedMonthsArr.forEach(function(item) {
            vm.essaysLabels.push(item.value);
        });
        sortedMonthsArr.forEach(function(item) {
            vm.essaysValues.push(item.number);
        });

        // pie
        if (vm.numberOfEssays){
            var stringWithAllEssays = '';
            for (var i = 0; i < vm.numberOfEssays; i++) {
                var currentEssayWordsArr = splitOnWords(vm.essaysList[i].essayText);
                currentEssayWordsArr.forEach(function(item) {
                    stringWithAllEssays += item + ' ';
                });
            }
            for (var i = 0; i < vm.numberOfWords; i++) {
                var target = vm.wordsList[i].word;

                if (stringWithAllEssays.toLowerCase().indexOf(target.toLowerCase()) > 0) {
                    vm.numberOfWordsUsedInEssays += 1;
                }
            }

            vm.pieData.push(vm.numberOfWords - vm.numberOfWordsUsedInEssays, vm.numberOfWordsUsedInEssays);

            function splitOnWords(string) {
                var tmp = document.createElement("div");
                tmp.innerHTML = string;
                var onlyText = tmp.textContent || tmp.innerText || "";

                return onlyText.split(' ');
            }
        }
        // ---/
    });

    function sortMonthsArrayAscending(arr) {
        return arr.sort(function(a, b) {
            var aYear = +a.value.substring(3);
            var aMonth = +a.value.substring(0, 2);
            var bYear = +b.value.substring(3);
            var bMonth = +b.value.substring(0, 2);

            if (aYear == bYear) {
                if (aMonth > bMonth) {
                    return 1;
                }
                if (aMonth < bMonth) {
                    return -1;
                }
                return 0;
            }

            if (aYear > bYear) {
                return 1;
            }
            if (aYear < bYear) {
                return -1;
            }
            return 0;
        });
    }

    function findValueInArraysObject(arr, value) {
        var index = -1;

        arr.forEach(function(item, i) {
            if (item.value == value) {
                index = i;
            }
        });

        return index;
    }


    // charts
    // WORDS chart
    $scope.datasetOverride = [{ yAxisID: 'y-axis-1', xAxisID: 'x-axis-1' }];
    $scope.options = {
        scales: {
            yAxes: [{
                id: 'y-axis-1',
                type: 'linear',
                display: true,
                position: 'left',
                scaleLabel: {
                    display: true,
                    labelString: 'NUMBER OF WORDS'
                },
                ticks: {
                    beginAtZero: true,
                    stepSize: 1
                }
            }],
            xAxes: [{
                id: 'x-axis-1',
                display: true,
                scaleLabel: {
                    display: true,
                    labelString: 'MONTHS'
                }
            }]
        }
    };
    // ESSAYS chart
    $scope.datasetOverrideEssay = [{ yAxisID: 'y-essay-axis-1', xAxisID: 'x-essay-axis-1' }];
    $scope.optionsEssay = {
        scales: {
            yAxes: [{
                id: 'y-essay-axis-1',
                type: 'linear',
                display: true,
                position: 'left',
                scaleLabel: {
                    display: true,
                    labelString: 'NUMBER OF ESSAYS'
                },
                ticks: {
                    beginAtZero: true,
                    stepSize: 1
                }
            }],
            xAxes: [{
                id: 'x-essay-axis-1',
                display: true,
                scaleLabel: {
                    display: true,
                    labelString: 'MONTHS'
                }
            }]
        }
    };

    // PIE chart
    $scope.optionsPie = {
        legend: {
            display: true,
            position: 'bottom',
            labels: {
                fontSize: 15
            }
        },
        tooltips: {
            callbacks: {
                label: function(tooltipItem, data) {
                    var indice = tooltipItem.index;
                    if (indice == 0){
                        var totalAmount = data.datasets[0].data[indice] + vm.numberOfWordsUsedInEssays;
                        return ' ' + totalAmount;
                    } else{
                        return ' ' + data.datasets[0].data[indice];
                    }
                }
            }
        }
    };
    // ---
}

angular.module('further.Words', [])
    .controller('WordsCtrl', WordsCtrl);

function WordsCtrl(fire, $rootScope, AuthFactory) {
    var vm = this;
    vm.auth = AuthFactory;
    vm.newWord = null;
    vm.newWordTranslation = null;
    vm.wordsList = [];

    vm.addNewWord = function() {
        if (vm.newWord && vm.newWordTranslation) {
            var date = new Date();
            var month = date.getMonth() + 1;
            if (month < 10) {
                month = '0' + month;
            }
            var created = date.getDate() + '.' + month + '.' + date.getFullYear();

            if (fire.addNewWord(vm.newWord, vm.newWordTranslation, created)) {
                vm.newWord = null;
                vm.newWordTranslation = null;
            }
        }
    };

    fire.getAllWords().then(function(_d) {
        vm.wordsList = _d;
    });
}

angular.module('further.Navbar', [])
    .controller('NavbarCtrl', NavbarCtrl);

function NavbarCtrl($rootScope, $state, AuthFactory, $location) {
    var vm = this;
    vm.auth = AuthFactory;

    vm.getTabName = function(){
        return $location.hash().replace(/(^#\/|\/$)/g, '');
    }

    vm.auth.authVar.$onAuthStateChanged(function(firebaseUser) {
        $rootScope.firebaseUser = firebaseUser;
        if ($rootScope.firebaseUser) {
            $state.go('words');
        }
    });

    vm.signOut = function() {
        vm.auth.signOut();
        $state.go('/');
    };
    vm.signIn = function() {
        vm.auth.signIn();
    };

    vm.photoURL = null;
}

angular
    .module("further.auth.factory", ["firebase"])
    .factory("AuthFactory", AuthFactory);

function AuthFactory($firebaseAuth) {
    var auth = $firebaseAuth();

    var service = {
    	authVar: auth,
        signIn: signIn,
        signOut: signOut
    };

    function signIn() {
        return auth.$signInWithPopup('google');
    }

    function signOut() {
        return auth.$signOut();
    }

    return service;
}

// Initialize Firebase
var config = {
    apiKey: "AIzaSyCEzgvtuQYnoz3JbmlIkJoSRPiDuXJrTwQ",
    authDomain: "parlaria-9a874.firebaseapp.com",
    databaseURL: "https://parlaria-9a874.firebaseio.com",
    projectId: "parlaria-9a874",
    storageBucket: "parlaria-9a874.appspot.com",
    messagingSenderId: "630755092176"
};
firebase.initializeApp(config);

angular
    .module('further.fire.service', ['firebase'])
    .service('fire', fire);

function fire($log, $firebaseObject, $firebaseArray, $rootScope, AuthFactory) {
    var vm = this;
    vm.auth = AuthFactory;

    var ref = firebase.database().ref();
    var uid = vm.auth.authVar.$getAuth().uid;

    // WORDS
    var wordsRef = ref.child(uid + '/words');
    var allWords = $firebaseArray(wordsRef);

    vm.getAllWords = function(cb) {
        return allWords.$loaded(cb);
    };
    vm.addNewWord = function(word, translation, created) {
        var duplicate = false;
        angular.forEach(allWords, function(value, key) {
            if (value.word == word) {
                duplicate = true;
                return;
            }
        });

        if (!duplicate) {
            var obj = {
                word: word,
                translation: translation,
                created: created
            };

            return allWords.$add(obj);
        }

        return false;
    };

    // ESSAY
    var essayRef = ref.child(uid + '/essay');
    var allEssays = $firebaseArray(essayRef);
    vm.addNewEssay = function(essayName, essayText, created) {
        var obj = {
            essayName: essayName,
            essayText: essayText,
            created: created
        };

        return allEssays.$add(obj);
    };
    vm.getAllEssays = function(cb) {
        return allEssays.$loaded(cb);
    };

    // PHRASES
    var phrasesRef = ref.child(uid + '/phrases');
    var allPhrases = $firebaseArray(phrasesRef);
    vm.addNewPhrase = function(phrase, description, created) {
        var obj = {
            phrase: phrase,
            description: description,
            created: created
        };

        return allPhrases.$add(obj);
    };
    vm.getAllPhrases = function(cb) {
        return allPhrases.$loaded(cb);
    };
}
