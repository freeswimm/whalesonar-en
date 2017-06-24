$(function () {
    
       
    var whale_sounds = [document.getElementById("whale1")];
    var dolphin_sounds = [document.getElementById("dolphin1"), document.getElementById("dolphin2"), document.getElementById("dolphin3")];
    var orca_sounds = [document.getElementById("orca1"), document.getElementById("orca2")];
   
    
    var balloon_bg = ['blue-bg', 'green-bg', 'pink-bg', 'yellow-bg', 'orange-bg'];
    
    var debug = true;
    var stop_mode = false;
    var show_only = '';        
        

    var MODE = 'steem';
    
    var LIFE_INTERVAL = 15;
    var DEFAULT_SP = 10000;
    var COOKIE_EXPIRES = 90;    
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
    
    if(Cookies.get('balloon_on') === 'on'){
       $('#balloon_on').attr('checked', true);
    } else if((Cookies.get('balloon_on') === 'off') || (Cookies.get('balloon_on') === undefined)){        
         $('#balloon_on').attr('checked', false);
    }
    
    if((Cookies.get('bg_on') === 'on') || (Cookies.get('bg_on') === undefined)){
       $('#bg_on').attr('checked', true);       
       $('body').addClass('bg-image');
    } else if((Cookies.get('bg_on') === 'off')){        
       $('#bg_on').attr('checked', false);
       $('body').addClass('bg-image2');
    }

    
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
        $('body').toggleClass('bg-image2');
        $('body').toggleClass('bg-image');
        
        if($('#bg_on').is(':checked')){
            Cookies.set('bg_on', 'on', {expires: COOKIE_EXPIRES});
        } else { 
            Cookies.set('bg_on', 'off', {expires: COOKIE_EXPIRES});
        }    
    });
    $('#balloon_on').on('change', function(){
        
        if($('#balloon_on').is(':checked')){
            $('.switch-balloon').removeClass('hidden');  
            Cookies.set('balloon_on', 'on', {expires: COOKIE_EXPIRES});            
        } else { 
            $('.switch-balloon').addClass('hidden'); 
            Cookies.set('balloon_on', 'off', {expires: COOKIE_EXPIRES});             
        }    
    });
    
    $('#sound_on').on('change', function(){       
        if($('#sound_on').is(':checked')){
            Cookies.set('sound_on', 'on', {expires: COOKIE_EXPIRES});
        } else { 
            Cookies.set('sound_on', 'off', {expires: COOKIE_EXPIRES});
        }       
    });
    
    $('body').on('click', '.author-link-overlay', function(){
        var link = $(this).data('link');
        if(link !== ''){
            window.open(link);
        }        
    });
    
    $('#minimize').click(function (e) {
        $(this).toggleClass('rotate-180');

        //containerHeight(); // recalculate page height

        $('.settings-box .wrapper').slideToggle(500, function(){$('#minimize').attr('style', 'display: block !important;');});
    });
    
    steem.api.getDynamicGlobalProperties(function (err, steem_data) {
        if (err === null) {

            steem.api.streamOperations(function (err, operations) {

                if (err === null) {
                    operations.forEach(function (operation) {
                        if ((operation.voter !== undefined) && (BLACK_LIST.indexOf(operation.voter) === -1)) {
                           // _d(operation);
                            steem.api.getAccounts([operation.voter], function (err, account) {
                                
                                if ((err === null)) {
                                    //var reputation = steem.formatter.reputation(result[0].reputation);
                                    var SP = getSteemPower(steem_data, account);
                                                                        
                                    if((show_only === '') || (show_only === account[0].name)){  // DEBUG row -> 
                                        if (SP >= $('#min_sp').val()*1) {

                                            var vote_data = {
                                                voter: account[0].name,
                                                author: operation.author,
                                                permlink: DOMAIN+'@'+operation.author+'/'+operation.permlink,
                                                link: DOMAIN+'@'+account[0].name,
                                                voter_id: 'v'+account[0].id, // убрать возможные точки из id
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
                params.alt = 'Dolphin';
                params.width = '100px';               
                break;
            case 'orca':
                params.pic = './img/orca.gif';
                params.alt = 'Orca';
                params.width = '140px';
                break;
            case 'whale':
                params.pic = './img/whale_small.gif';
                params.alt = 'Whale';
                params.width = '220px';
                break;
            case 'big_whale':
                params.pic = './img/whale_small.gif';
                params.alt = 'Blue whale';
                params.width = '280px';
                break;
        }       
        
        var author_bg = (data.author === $('#name').val()) ? 'burn-bg' : balloon_bg[getRand(0,4)]; 
        var balloon_on = ($('#balloon_on').is(':checked')) ? 'switch-balloon' : 'switch-balloon hidden';
        
        if($('*').is('#'+data.voter_id)) {                        
            
            if($('#balloon_on').is(':checked')){
                $('#'+data.voter_id+' .author-balloon span').text(data.author);
                $('#'+data.voter_id+' .author-link-overlay').data('link', data.permlink);
                $('#'+data.voter_id+' .sp-title span').text(data.weight+"%");
                $('#'+data.voter_id+' .author-balloon').removeClass().addClass('author-balloon').addClass('is-right-side').addClass(author_bg).addClass(balloon_on);
            }    
        } else {                                    
             
            var timeoutID = setTimeout(function(){
                
                if(!stop_mode){ // DEBUG row 
                    $('#'+data.voter_id).remove();
                
                    $('#keyframe_'+data.voter_id).remove();
                }
                
            }, LIFE_INTERVAL*1000);
            
            
            if(!stop_mode){ // DEBUG row 
                $("<style id='keyframe_"+data.voter_id+"' type='text/css'>"+getLocus(data.voter_id)+" </style>").appendTo("head");
            } else {
                // DEBUG row 
                $("<style id='keyframe_"+data.voter_id+"' type='text/css'> #"+data.voter_id+"{top: 60%; left: 65%;} </style>").appendTo("head");
            }          
            
            var voter_bg = (data.voter === $('#name').val()) ? 'burn-bg' : 'blue-bg'; 
            var balloon_on = ($('#balloon_on').is(':checked')) ? 'switch-balloon' : 'switch-balloon hidden';
        
            var container = "<div class='creature' id='"+data.voter_id+"' data-clear_id='"+timeoutID+"' style='animation:swim_"+data.voter_id+" "+LIFE_INTERVAL+"s infinite linear;'>\n\
                             <a href='"+data.link+"'  target='_blank'>\n\
                             <img src='"+params.pic+"' alt='"+params.alt+"' width='"+params.width+"'/>\n\
                             </a>\n\
                             <span class='voter-title is-right-side "+voter_bg+" "+balloon_on+"'>"+data.voter+"</span>\n\
                                <svg class='title-curve-line "+balloon_on+"'>\n\
                                  <path fill='none' stroke='#99b' stroke-width='1' d='M30,0 Q30,50 60,60' />\n\
                                </svg>\n\
                             <span class='author-balloon is-right-side "+author_bg+" "+balloon_on+"'><span>"+data.author+"</span></span>\n\
                             <div class='sp-title is-right-side "+balloon_on+"'><span>"+data.weight+"%</span></div>\n\
                             <span class='ballon-nippel "+balloon_on+"'></span>\n\
                             <div class='author-link-overlay "+balloon_on+"' data-link='"+data.permlink+"'></div>\n\
                            </div>";
            $('body').append(container);
        }              
    }
    
    function classificate(data) {

        gests = (data.gests*1) / 1000000;
        
        if ((gests >= 10) && (gests < 100)) {
            data.sound = dolphin_sounds[getRand(0,dolphin_sounds.length-1)];
            data.species = 'dolphin';
        }
        if ((gests >= 100) && (gests < 1000)) {
            data.sound = orca_sounds[getRand(0,orca_sounds.length-1)];
            data.species = 'orca';
        }
        if ((gests >= 1000) && (gests < 3000)) {
            data.sound = whale_sounds[getRand(0,whale_sounds.length-1)];
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