$(function () {
    var big_whale_sound = document.getElementById("small_whale");
    var small_whale_sound = document.getElementById("small_whale");
    var dolphin_sound = document.getElementById("dolphin");
    var orca_sound = document.getElementById("orca");
    
    var LIFE_INTERVAL = 15;
   
    var black_list = ['cheetah'];
    
    steem.api.getDynamicGlobalProperties(function (err, steem_data) {
        if (err === null) {

            steem.api.streamOperations(function (err, operations) {

                if (err === null) {
                    operations.forEach(function (operation) {
                       
                        if ((operation.voter !== undefined) && (black_list.indexOf(operation.voter) === -1)) {                           
                          
                            steem.api.getAccounts([operation.voter], function (err, account) {
                                
                                if (err === null) {
                                   
                                    var SP = getSteemPower(steem_data, account);
                              
                                    if (SP >= $('#min_sp').val()*1) {
                                       
                                        var vote_data = {
                                            voter: account[0].name,
                                            author: operation.author,
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
        console.log(whale_data);        
       
        createWhale(whale_data);        
      
        if (whale_data.sound) {
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
                params.alt = 'Big whale';
                params.width = '280px';
                break;
        }
             
        if($('*').is('#'+data.voter)) {
          
            clearTimeout($('#'+data.voter).data('clear_id'));   
                      
            var timeoutID = setTimeout(function(){
                $('#'+data.voter).remove();
             
                $('#keyframe_'+data.voter).remove();
            }, LIFE_INTERVAL*1000);
                       
            $('#'+data.voter).data('clear_id', timeoutID);  
            
        } else {
          
            var timeoutID = setTimeout(function(){
                $('#'+data.voter).remove();
                               
                $('#keyframe_'+data.voter).remove();
            }, LIFE_INTERVAL*1000);
                       
            $("<style id='keyframe_"+data.voter+"' type='text/css'>"+getLocus(data.voter)+" </style>").appendTo("head");
            
            var container = "<div class='creature' id='"+data.voter+"' data-clear_id='"+timeoutID+"' style='animation:swim_"+data.voter+" "+LIFE_INTERVAL+"s infinite linear;'><img src='"+params.pic+"' alt='"+params.alt+"' width='"+params.width+"'><span class='voter-title is-right-side'>"+data.voter+"</span></div>";
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
           
    function getLocus(voter){
        var top_poin_interval_1 = getRand(15, 50);
        var top_poin_interval_2 = top_poin_interval_1+7;
       
        var locus_set = [
          
            "@keyframes swim_"+voter+"{from{left:-5%; top: "+getRand(10, 82)+"%;} to{left:100%; top: "+getRand(10, 82)+"%;}} @-moz-keyframes swim_"+voter+"{from{left:-5%; top: "+getRand(10, 82)+"%;} to{left:100%; top: "+getRand(10, 82)+"%;}} @-webkit-keyframes swim_"+voter+"{from{left:-5%; top: "+getRand(10, 82)+"%;} to{left:100%; top: "+getRand(10, 82)+"%;}}",
            "@keyframes swim_"+voter+"{from{left:-5%; top: "+getRand(5, 20)+"%;} "+top_poin_interval_1+"%{top:0%; transform: rotate(-25deg);} "+top_poin_interval_2+"%{top:-6%; transform: rotate(0deg);} to{left:100%; top: "+getRand(10, 40)+"%;}} @-moz-keyframes swim_"+voter+"{from{left:-6%; top: "+getRand(5, 20)+"%;} "+top_poin_interval_1+"{top:0%; transform: rotate(-25deg);} "+top_poin_interval_2+"%{top:-6%; transform: rotate(0deg);} to{left:100%; top: "+getRand(10, 40)+"%;}} @-webkit-keyframes swim_"+voter+"{from{left:-5%; top: "+getRand(5, 20)+"%;} "+top_poin_interval_1+"%{top:0%; transform: rotate(-25deg);} "+top_poin_interval_2+"%{top:-5%; transform: rotate(0deg);} to{left:100%; top: "+getRand(10, 40)+"%;}}",
          
            "@keyframes swim_"+voter+"{from{right:-5%; top: "+getRand(10, 82)+"%; transform:scaleX(-1);} to{right:100%; top: "+getRand(10, 82)+"%; transform:scaleX(-1);}} @-moz-keyframes swim_"+voter+"{from{right:-5%; top: "+getRand(10, 82)+"%; transform:scaleX(-1);} to{right:100%; top: "+getRand(10, 82)+"%; transform:scaleX(-1);}} @-webkit-keyframes swim_"+voter+"{from{right:-5%; top: "+getRand(10, 82)+"%; transform:scaleX(-1);} to{right:100%; top: "+getRand(10, 82)+"%; transform:scaleX(-1);}} #"+voter+" .is-right-side {transform:scaleX(-1);}",
            "@keyframes swim_"+voter+"{from{right:-5%; top: "+getRand(5, 82)+"%; transform:scaleX(-1);} "+top_poin_interval_1+"%{top:0%; transform: rotate(25deg) scaleX(-1);} "+top_poin_interval_2+"%{top:-6%; transform: rotate(0deg) scaleX(-1);} to{right:100%; top: "+getRand(10, 82)+"%; transform:scaleX(-1);}} @-moz-keyframes swim_"+voter+"{from{right:-6%; top: "+getRand(5, 82)+"%; transform:scaleX(-1);} "+top_poin_interval_1+"{top:0%; transform: rotate(25deg) scaleX(-1);} "+top_poin_interval_2+"%{top:-6%; transform: rotate(0deg) scaleX(-1);} to{right:100%; top: "+getRand(10, 82)+"%; transform:scaleX(-1);}} @-webkit-keyframes swim_"+voter+"{from{right:-5%; top: "+getRand(5, 82)+"%; transform:scaleX(-1);} "+top_poin_interval_1+"%{top:0%; transform: rotate(25deg) scaleX(-1);} "+top_poin_interval_2+"%{top:-5%; transform: rotate(0deg) scaleX(-1);} to{right:100%; top: "+getRand(10, 82)+"%; transform:scaleX(-1);}} #"+voter+" .is-right-side {transform:scaleX(-1);}",
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
  
    var input_event = (('oninput' in document)) ? 'input' : 'keyup';
       
    $('#min_sp').on(input_event, function(){
        $(this).val(validate($(this).val()));
    });
});