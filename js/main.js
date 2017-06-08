$(function () {
    
    var big_whale_sound = document.getElementById("small_whale");
    var small_whale_sound = document.getElementById("small_whale");
    var dolphin_sound = document.getElementById("dolphin");
    var orca_sound = document.getElementById("orca");
    
    var debug = true;
    
    var MODE = 'steem';
    
    var LIFE_INTERVAL = 15;
    var DEFAULT_SP = 10000;
    var COOKIE_EXPIRES = 30;    
    var BLACK_LIST = 'cheetah';
    
    if(MODE == 'golos'){
        steem.config.set('websocket', 'wss://ws.golos.io');
        var DOMAIN = 'https://golos.io/';
    } else {
        var DOMAIN = 'https://steemit.com/';
    }
   
    if((Cookies.get('name') !== 'null') && (Cookies.get('name') !== undefined)){
        $('#name').val(Cookies.get('name'));       
    }
    if(Cookies.get('min_sp') !== undefined){
        $('#min_sp').val(Cookies.get('min_sp'));
    } else {
        $('#min_sp').val(DEFAULT_SP);
    }
    if(Cookies.get('black_list') !== undefined){
        BLACK_LIST = Cookies.get('black_list');
        $('#black_list').val(BLACK_LIST);
    } else {
        $('#black_list').val(BLACK_LIST);
    }

    BLACK_LIST = BLACK_LIST.replace(/\s+/g, '').split(',');
    
    if(Cookies.get('sound_on') === 'on'){
       $('#sound_on').attr('checked', true);
    } else if((Cookies.get('sound_on') === 'off') || (Cookies.get('sound_on') === undefined)){        
         $('#sound_on').attr('checked', false);
    }
    
    if((Cookies.get('bg_on') === 'on') || (Cookies.get('bg_on') === undefined)){
       $('#bg_on').attr('checked', true);       
       $('body').addClass('bg-image');
    } else if((Cookies.get('bg_on') === 'off')){        
       $('#bg_on').attr('checked', false);
       $('body').addClass('bg-gradient');
    }

    /* Events  */
    
    var input_event = (('oninput' in document)) ? 'input' : 'keyup';
    
    $('#min_sp').on(input_event, function(){
        var sp = validate($(this).val());
        Cookies.set('min_sp', $('#min_sp').val(), {expires: COOKIE_EXPIRES});
        $(this).val(sp);
    });
    
    $('#name').on(input_event, function(){
        Cookies.set('name', $('#name').val(), {expires: COOKIE_EXPIRES});
    });
    
    $('#black_list').on(input_event, function(){        
        Cookies.set('black_list', $('#black_list').val(), {expires: COOKIE_EXPIRES});
        BLACK_LIST = $('#black_list').val().replace(/\s+/g, '').split(',');
    });

    $('#bg_on').on('change', function(){
        $('body').toggleClass('bg-gradient');
        $('body').toggleClass('bg-image');
        
        if($('#bg_on').is(':checked')){
            Cookies.set('bg_on', 'on', {expires: COOKIE_EXPIRES});
        } else { 
            Cookies.set('bg_on', 'off', {expires: COOKIE_EXPIRES});
        }    
    });
    
    $('#sound_on').on('change', function(){       
        if($('#sound_on').is(':checked')){
            Cookies.set('sound_on', 'on', {expires: COOKIE_EXPIRES});
        } else { 
            Cookies.set('sound_on', 'off', {expires: COOKIE_EXPIRES});
        }       
    });
   
    
    steem.api.getDynamicGlobalProperties(function (err, steem_data) {
        if (err === null) {

            steem.api.streamOperations(function (err, operations) {

                if (err === null) {
                    operations.forEach(function (operation) {
                     
                        if ((operation.voter !== undefined) && (BLACK_LIST.indexOf(operation.voter) === -1)) {
                           
                            steem.api.getAccounts([operation.voter], function (err, account) {
                                
                                if (err === null) {
                                  
                                    var SP = getSteemPower(steem_data, account);
                              
                                    if (SP >= $('#min_sp').val()*1) {
                                       
                                        var vote_data = {
                                            voter: account[0].name,
                                            author: operation.author,
                                            link: DOMAIN+'@'+account[0].name,
                                            voter_id: 'v'+account[0].id, 
                                            sp: SP,
                                            ava: getAvatar(account),
                                            weight: operation.weight / 100,
                                            timestart: Math.floor(Date.now() / 1000),
                                            sound: false,
                                            species: '',
                                            gests: account[0].vesting_shares.split(' ')[0]
                                        };
                                        
                                        releaseWhale(vote_data);
                                    }
                                } else {
                                    console.log('Error! Cant get account:', err);
                                }
                            });
                        }
                    });
                } else {
                    console.log('Error! Cant get stream:', err);
                }
            });
        } else {
            console.log('Error! Cant get global properties:', err);
        }
    });
    
    function getSteemPower(steem_data, acc) {
        var movementGlobal = steem_data.total_vesting_shares.split(' ')[0];
        var powerGlobal = steem_data.total_vesting_fund_steem.split(' ')[0];
        var accVests = acc[0].vesting_shares.split(' ')[0];
        return (powerGlobal * (accVests / movementGlobal)).toFixed(3);
    }
   
    function getAvatar(acc) {
        try {
            if (('json_metadata' in acc[0])) {
                var metadata = $.parseJSON(acc[0].json_metadata);
                if ('profile' in metadata) {
                    if ('profile_image' in metadata.profile) {
                        return metadata.profile.profile_image;
                    }
                }
            }
        } catch (e) {
            console.log('json parse error');
            return false;
        }
        return false;
    }
    
    function releaseWhale(whale_data) {
               
        whale_data = classificate(whale_data);

        _d(whale_data);        
       
        createWhale(whale_data);        
       
        if (whale_data.sound && $('#sound_on').is(':checked')) {
            setTimeout(function () {
                whale_data.sound.play();
            }, 1000);
        }       
    }
       
    function createWhale(data){
        
        if(data.species === '') { return false;}
        
        var params = {pic: '', alt:'', width: 0};
        
        switch(data.species){
            case 'dolphin':
                params.pic = './img/dolphin.gif';
                params.alt = 'Дельфин';
                params.width = '100px';               
                break;
            case 'orca':
                params.pic = './img/orca.gif';
                params.alt = 'Косатка';
                params.width = '140px';
                break;
            case 'whale':
                params.pic = './img/whale_small.gif';
                params.alt = 'Кит';
                params.width = '220px';
                break;
            case 'big_whale':
                params.pic = './img/whale_small.gif';
                params.alt = 'Синий кит';
                params.width = '280px';
                break;
        }
             
        if($('*').is('#'+data.voter_id)) {
            
            clearTimeout($('#'+data.voter_id).data('clear_id'));   
                       
            var timeoutID = setTimeout(function(){
                $('#'+data.voter_id).remove();
              
                $('#keyframe_'+data.voter_id).remove();
            }, LIFE_INTERVAL*1000);
                       
            $('#'+data.voter_id).data('clear_id', timeoutID);  
            
        } else {
           
            var timeoutID = setTimeout(function(){
                $('#'+data.voter_id).remove();
                              
                $('#keyframe_'+data.voter_id).remove();
            }, LIFE_INTERVAL*1000);
                     
            $("<style id='keyframe_"+data.voter_id+"' type='text/css'>"+getLocus(data.voter_id)+" </style>").appendTo("head");
           
            var bg = (data.voter === $('#name').val()) ? 'burn-bg' : 'blue-bg';
            var container = "<div class='creature' id='"+data.voter_id+"' data-clear_id='"+timeoutID+"' style='animation:swim_"+data.voter_id+" "+LIFE_INTERVAL+"s infinite linear;'><a href='"+data.link+"' target='_blank'><img src='"+params.pic+"' alt='"+params.alt+"' width='"+params.width+"'/></a><span class='voter-title is-right-side "+bg+"'>"+data.voter+"</span></div>";
            $('body').append(container);
        }              
    }    
  
    function classificate(data) {
      
        gests = (data.gests*1) / 1000000;
        
        if ((gests >= 10) && (gests < 100)) {
            data.sound = dolphin_sound;
            data.species = 'dolphin';
        }
        if ((gests >= 100) && (gests < 1000)) {
            data.sound = orca_sound;
            data.species = 'orca';
        }
        if ((gests >= 1000) && (gests < 3000)) {
            data.sound = small_whale_sound;
            data.species = 'whale';
        }
        if (gests > 3000) {
            data.sound = big_whale_sound;
            data.species = 'big_whale';
        } 
        return data;        
    }
      
    function getLocus(voter_id){
        var top_poin_interval_1 = getRand(15, 50);
        var top_poin_interval_2 = top_poin_interval_1+7;
      
        var locus_set = [
           
            "@keyframes swim_"+voter_id+"{from{left:-5%; top: "+getRand(10, 82)+"%;} to{left:100%; top: "+getRand(10, 82)+"%;}} @-moz-keyframes swim_"+voter_id+"{from{left:-5%; top: "+getRand(10, 82)+"%;} to{left:100%; top: "+getRand(10, 82)+"%;}} @-webkit-keyframes swim_"+voter_id+"{from{left:-5%; top: "+getRand(10, 82)+"%;} to{left:100%; top: "+getRand(10, 82)+"%;}}",
            "@keyframes swim_"+voter_id+"{from{left:-5%; top: "+getRand(5, 20)+"%;} "+top_poin_interval_1+"%{top:0%; transform: rotate(-25deg);} "+top_poin_interval_2+"%{top:-6%; transform: rotate(0deg);} to{left:100%; top: "+getRand(10, 40)+"%;}} @-moz-keyframes swim_"+voter_id+"{from{left:-6%; top: "+getRand(5, 20)+"%;} "+top_poin_interval_1+"{top:0%; transform: rotate(-25deg);} "+top_poin_interval_2+"%{top:-6%; transform: rotate(0deg);} to{left:100%; top: "+getRand(10, 40)+"%;}} @-webkit-keyframes swim_"+voter_id+"{from{left:-5%; top: "+getRand(5, 20)+"%;} "+top_poin_interval_1+"%{top:0%; transform: rotate(-25deg);} "+top_poin_interval_2+"%{top:-5%; transform: rotate(0deg);} to{left:100%; top: "+getRand(10, 40)+"%;}}",
           
            "@keyframes swim_"+voter_id+"{from{right:-5%; top: "+getRand(10, 82)+"%; transform:scaleX(-1);} to{right:100%; top: "+getRand(10, 82)+"%; transform:scaleX(-1);}} @-moz-keyframes swim_"+voter_id+"{from{right:-5%; top: "+getRand(10, 82)+"%; transform:scaleX(-1);} to{right:100%; top: "+getRand(10, 82)+"%; transform:scaleX(-1);}} @-webkit-keyframes swim_"+voter_id+"{from{right:-5%; top: "+getRand(10, 82)+"%; transform:scaleX(-1);} to{right:100%; top: "+getRand(10, 82)+"%; transform:scaleX(-1);}} #"+voter_id+" .is-right-side {transform:scaleX(-1);}",
            "@keyframes swim_"+voter_id+"{from{right:-5%; top: "+getRand(5, 82)+"%; transform:scaleX(-1);} "+top_poin_interval_1+"%{top:0%; transform: rotate(25deg) scaleX(-1);} "+top_poin_interval_2+"%{top:-6%; transform: rotate(0deg) scaleX(-1);} to{right:100%; top: "+getRand(10, 82)+"%; transform:scaleX(-1);}} @-moz-keyframes swim_"+voter_id+"{from{right:-6%; top: "+getRand(5, 82)+"%; transform:scaleX(-1);} "+top_poin_interval_1+"{top:0%; transform: rotate(25deg) scaleX(-1);} "+top_poin_interval_2+"%{top:-6%; transform: rotate(0deg) scaleX(-1);} to{right:100%; top: "+getRand(10, 82)+"%; transform:scaleX(-1);}} @-webkit-keyframes swim_"+voter_id+"{from{right:-5%; top: "+getRand(5, 82)+"%; transform:scaleX(-1);} "+top_poin_interval_1+"%{top:0%; transform: rotate(25deg) scaleX(-1);} "+top_poin_interval_2+"%{top:-5%; transform: rotate(0deg) scaleX(-1);} to{right:100%; top: "+getRand(10, 82)+"%; transform:scaleX(-1);}} #"+voter_id+" .is-right-side {transform:scaleX(-1);}",
        ];
       
        return locus_set[getRand(0, locus_set.length-1)];
    }
    
    function getRand(min, max) {
        var rand = min + Math.random() * (max + 1 - min);
        rand = Math.floor(rand);
        return rand*1;
    }
       
    function validate(str){ 
        return str.replace(/[^\d]/g, ''); 
    }
    
    
    function _d(param){
        if(debug){
            console.log(param);
        }
    }
});