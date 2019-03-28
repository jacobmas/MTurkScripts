// ==UserScript==
// @name         uld aggregators
// @namespace    http://tampermonkey.net/
// @version      0.1
// @description  New script
// @author       You
// @include        http://*.mturkcontent.com/*
// @include        https://*.mturkcontent.com/*
// @include        http://*.amazonaws.com/*
// @include        https://*.amazonaws.com/*
// @include https://worker.mturk.com/*
// @grant  GM_getValue
// @grant GM_setValue
// @grant GM_addValueChangeListener
// @grant GM_setClipboard
// @grant GM_xmlhttpRequest
// @grant GM_openInTab
// @grant GM_getResourceText
// @grant GM_addStyle
// @connect google.com
// @connect bing.com
// @connect *
// @require https://raw.githubusercontent.com/hassansin/parse-address/master/parse-address.min.js
// @require https://raw.githubusercontent.com/jacobmas/MTurkScripts/master/js/MTurkScript.js
// @resource GlobalCSS https://raw.githubusercontent.com/jacobmas/MTurkScripts/master/global/globalcss.css
// ==/UserScript==

(function() {
    'use strict';
    var my_query = {};
    var bad_urls=[];
    var MTurk=new MTurkScript(10000,200,[],begin_script,"A1HIKAC09CE64A",false);
    var MTP=MTurkScript.prototype;
    function is_bad_name(b_name)
    {
        return false;
    }

    function query_response(response,resolve,reject) {
        var doc = new DOMParser()
        .parseFromString(response.responseText, "text/html");
        console.log("in query_response\n"+response.finalUrl);
        var search, b_algo, i=0, inner_a;
        var b_url="crunchbase.com", b_name, b_factrow,lgb_info, b_caption,p_caption;
        var b1_success=false, b_header_search,b_context,parsed_context,parsed_lgb;
        try
        {
            search=doc.getElementById("b_content");
            b_algo=search.getElementsByClassName("b_algo");
            lgb_info=doc.getElementById("lgb_info");
            b_context=doc.getElementById("b_context");
            console.log("b_algo.length="+b_algo.length);
	    if(b_context&&(parsed_context=MTP.parse_b_context(b_context))) {
                console.log("parsed_context="+JSON.stringify(parsed_context)); }
            if(lgb_info&&(parsed_lgb=MTP.parse_lgb_info(lgb_info))) {
                    console.log("parsed_lgb="+JSON.stringify(parsed_lgb)); }
            for(i=0; i < b_algo.length; i++)
            {
                b_name=b_algo[i].getElementsByTagName("a")[0].textContent;
                b_url=b_algo[i].getElementsByTagName("a")[0].href;
                b_caption=b_algo[i].getElementsByClassName("b_caption");
                p_caption="";
                if(b_caption.length>0 && b_caption[0].getElementsByTagName("p").length>0) {
                    p_caption=b_caption[0].getElementsByTagName("p")[0].innerText;
                }
                console.log("("+i+"), b_name="+b_name+", b_url="+b_url+", p_caption="+p_caption);
                if(!MTurkScript.prototype.is_bad_url(b_url, bad_urls) && !is_bad_name(b_name))
                {
                    b1_success=true;
                    break;

                }

            }
            if(b1_success)
            {
                /* Do shit */
                resolve(b_url);
                return;
            }
        }
        catch(error)
        {
            reject(error);
            return;
        }
        reject("Nothing found");
        //        GM_setValue("returnHit",true);
        return;

    }

    /* Search on bing for search_str, parse bing response with callback */
    function query_search(search_str, resolve,reject, callback) {
        console.log("Searching with bing for "+search_str);
        var search_URIBing='https://www.bing.com/search?q='+
            encodeURIComponent(search_str)+"&first=1&rdr=1";
        GM_xmlhttpRequest({method: 'GET', url: search_URIBing,
                           onload: function(response) { callback(response, resolve, reject); },
                           onerror: function(response) { reject("Fail"); },
                           ontimeout: function(response) { reject("Fail"); }
                          });
    }

    /* Following the finding the district stuff */
    function query_promise_then(result) {
    }

    function begin_script(timeout,total_time,callback) {
        if(timeout===undefined) timeout=200;
        if(total_time===undefined) total_time=0;
        if(callback===undefined) callback=init_Query;
        if(MTurk!==undefined) { callback(); }
        else if(total_time<2000) {
            console.log("total_time="+total_time);
            total_time+=timeout;
            setTimeout(function() { begin_script(timeout,total_time,callback); },timeout);
            return;
        }
        else { console.log("Failed to begin script"); }
    }

    function add_to_sheet() {
        var x,field;
        for(x in my_query.fields) if(field=document.getElementById(x)) field.value=my_query.fields[x];
    }

    function submit_if_done() {
        var is_done=true,x;
        add_to_sheet();
        for(x in my_query.done) if(!done[x]) is_done=false;
        if(is_done && !my_query.submitted && (my_query.submitted=true)) MTurk.check_and_submit();
    }

    
    function fix_address_initial(address) {
        return address.replace(/^[^\d,]+,\s*/,"");
    }
    function matches_names(name1,name2) {
        var num_replace={"$10$2":/(^|[^A-Za-z])Zero($|[^A-Za-z])/i,"$11$2":/(^|[^A-Za-z])One($|[^A-Za-z])/i,"$12$2":/(^|[^A-Za-z])Two($|[^A-Za-z])/i,
                         "$13$2":/(^|[^A-Za-z])Three($|[^A-Za-z])/i,"$14$2":/(^|[^A-Za-z])Four($|[^A-Za-z])/i,"$15$2":/(^|[^A-Za-z])Five($|[^A-Za-z])/i,
        "$16$2":/(^|[^A-Za-z])Six($|[^A-Za-z])/i,"$17$2":/(^|[^A-Za-z])Seven($|[^A-Za-z])/i,"$18$2":/(^|[^A-Za-z])Eight($|[^A-Za-z])/i,
            "$19$2":/(^|[^A-Za-z])Nine($|[^A-Za-z])/i };
        var and_regex=/\s+(&|and)\s+.*$/,extra_regex=/[\.\']+/g,prefix_reg=/^The\s*/i,i,at_reg=/\s+(@|at)\s+.*$/;
        var split_camel=/([a-z]{1})([A-Z]{1})/,chain_reg=/^(Walmart).*$/,street_reg=/([^a-zA-Z]{1}|^)Street\s+/i;
        var final_my,final_other,x;
        var my_name=name1.replace(extra_regex,"").replace(chain_reg,"")
        .replace(prefix_reg,"").replace(split_camel,"$1 $2").replace(/-/g," ").replace(street_reg,"$1St ");
        for(x in num_replace) my_name=my_name.replace(num_replace[x],x);
        final_my=my_name.replace(and_regex,"").replace(at_reg,"").replace(/\s/g,"").toLowerCase().trim();
        var other_name=name2.replace(extra_regex,"").replace(chain_reg,"").replace(prefix_reg,"").replace(split_camel,"$1 $2")
        .replace(/-/g," ").replace(street_reg,"St ");
        for(x in num_replace) other_name=other_name.replace(num_replace[x],x);
        final_other=other_name.replace(and_regex,"").replace(at_reg,"").replace(/\s/g,"").toLowerCase().trim();
        console.log("my_name="+my_name+", other_name="+other_name);
        if(final_my===final_other || final_my.indexOf(final_other)!==-1 || final_other.indexOf(final_my)!==-1) return true;
        for(i=0;i<final_my.length;i++) if(final_my.charAt(i)!==final_other.charAt(i)) break;
        if(i*5/3>=final_my.length) return true;
        var my_split=my_name.split(" ");
        var other_split=other_name.split(" ");
        if(my_split[0].toLowerCase()===other_split[0].toLowerCase() &&
           my_split[my_split.length-1].toLowerCase()===other_split[other_split.length-1].toLowerCase()) return true;
        return false;
    }
    function matches_address(add1,add2) {
        add1=fix_address_str(add1);
        add2=fix_address_str(add2);
    }
    function fix_address_str(add) {
    }
    function matches_parsed_add(add1,add2) {
        var x;
        var equiv_units;
        var count_bad=0;
        for(x in add2) {
            if(x==="sec_unit_type") continue;
            if(!add1[x]) continue;
            else if(add1[x].replace(/[-\s]+/g,"").toLowerCase()!==add2[x].replace(/[-\s]+/g,"").toLowerCase())
            {
                count_bad++;
                console.log("Failed to match addressses on "+x);
                if((x==="street" && add1[x].indexOf(add2[x])===-1 && add2[x].indexOf(add1[x])===-1) || count_bad>=2) return false;
                //return false;
            }
        }
        return true;
    }
    function fix_street(str) {
        var term_map={"Highway$1":/(?:Hwy|(?:State )?(?:Rt|Route|Rte))([^A-Za-z]{1}|$)/i,"St$1":/(?:Saint)([^A-Za-z]{1}|$)/,
                     "NW$1":/Northwest([^A-Za-z]{1}|$)/i,"$1Center$2":/([^A-Za-z]{1}|^)Ctr([^A-Za-z]{1}|$)/i},x,temp_reg;
        for(x in state_map) str=str.replace(new RegExp(state_map[x]+"-"),"Highway ");
        str=str.replace(/US-/i,"Highway ");
        for(x in term_map) str=str.replace(term_map[x],x);
        return str;
    }
    function fix_cell(good_cell) {
        good_cell=fix_state_repeats(good_cell);
        good_cell=fix_bad_suite(good_cell);
        return good_cell;
    }
    function fix_bad_suite(good_cell) {
        return good_cell.replace(/(Rd|St|Blvd|Dr|Ave)\s+([^,\s]*),/,function(match,p1,p2) {
            if(/^(Ste|Suite|Unit|#)/i.test(p2)) return p1+","+p2+",";
            else return p1+", Suite "+p2+",";
        });

    }
    function fix_state_repeats(good_cell) {
        var x;
        var temp_reg;
        for(x in state_map) {
            if(state_map[x]==="NY") continue;
            temp_reg=new RegExp("(,\\s*)"+x+",\\s*"+state_map[x]);
           // console.log(temp_reg);
            good_cell=good_cell.replace(temp_reg,"$1"+state_map[x]);
        }
        return good_cell;
    }

    function check_table(wT) {
        var row,i,good_cell,x;
        var all_same=true,temp_test;
        var other_list=[],curr_item={};
         var split_reg_2=/^([^,]*),\s*([^,]*,[^,]*),\s*(.*),\s*([^,]*)\n$/,match;
        for(i=0;i<wT.rows.length-1;i++) {
            row=wT.rows[i];
            if(row.cells.length<2 || row.cells[1].innerText.trim().length===0) continue;
            curr_item={};
            good_cell=row.cells[1].innerText;
            good_cell=fix_cell(good_cell);
            match=good_cell.match(split_reg_2);
            console.log("good_cell["+i+"]="+good_cell+", match="+JSON.stringify(match));
            if(!match) { console.log("Match failed"); GM_setValue("returnHit",true); return; }
            curr_item.name=match[1];
            curr_item.address=fix_address_initial(fix_street(match[3])+","+match[2]+" "+match[4]);
            curr_item.parsed_add=parseAddress.parseLocation(curr_item.address);
            console.log("curr_item["+i+"]="+JSON.stringify(curr_item));
            other_list.push(curr_item);
        }

        for(i=0;i<other_list.length;i++) {
            console.log("other_list["+i+"]="+JSON.stringify(other_list[i]));
            if(temp_test=matches_name(other_list[i].name)) {
                console.log("Matched name at "+i); }
            all_same=all_same & temp_test;
            if(temp_test=matches_parsed_add(other_list[i].parsed_add)) {
                console.log("Matched address at "+i); }
            all_same=all_same & temp_test;
        }
        if(all_same) {
            console.log("All are same");
            document.getElementsByName("response_none")[0].checked=true;
            MTurk.check_and_submit();
            return;

        }
        console.log("Failed");
        GM_setValue("returnHit",true);
    }
    function do_checkboxes() {
        var has_checked=false,i,j;
        var checkboxes=document.querySelectorAll("#workContent .checkbox");
        var pairs=[],split,parsed1,parsed2,name,address,parsed_add,pair_lst;
        for(i=0;i<checkboxes.length-1;i++) {
            split=checkboxes[i].innerText.split("\n");
            pair_lst=[];
            for(j=0;j<split.length;j++) {
                name=split[j].replace(/^([^,]+),.*$/,"$1");
                address=fix_address_initial(split[j].replace(new RegExp("^"+name+","),"").replace(/,\s*USA\s*$/,""));
                console.log("("+i+","+j+"), name="+name+", address="+address);
                parsed_add=parseAddress.parseLocation(address);
                pair_lst.push({name:name,address:parsed_add});
            }
            pairs.push(pair_lst);
        }
        console.log("pairs="+JSON.stringify(pairs));
        if(!compare_checkboxes(pairs)) {
            checkboxes[checkboxes.length-1].querySelector("input").checked=true;
        }
        MTurk.check_and_submit();
        //console.log("pairs="+JSON.stringify(pairs));

    }

    function compare_checkboxes(pairs) {
        var count=0,i;
        var checkboxes=document.querySelectorAll("#workContent .checkbox");
        for(i=0;i<pairs.length;i++) {
            if(MTP.matches_names(pairs[i][0].name,pairs[i][1].name) &&
               matches_parsed_add(pairs[i][0].address,pairs[i][1].address)) {
                checkboxes[i].querySelector("input").checked=true;
                count++;
            }
        }
        return count>0;
    }

    function init_Query()
    {
        console.log("in init_query");
        var i;
        do_checkboxes();
        return;
        var wT=document.getElementById("workContent").getElementsByTagName("table")[0];
        var dont=decodeURIComponent(document.getElementsByClassName("dont-break-out")[0].href.replace("http://www.google.com/search?q=",""));
        my_query={name,fields:{},done:{},submitted:false,original:dont};
        var split_reg=/^([^,]*),\s*(.*),\s*USA$/,match;
        match=my_query.original.match(split_reg);
        console.log("match="+JSON.stringify(match));
        if(!match) { GM_setValue("returnHit",true); return; }
        my_query.name=match[1];
        my_query.address=fix_cell(match[2]);
        my_query.address=fix_address_initial(my_query.address);
        my_query.parsed_add=parseAddress.parseLocation(my_query.address);
        my_query.parsed_add.street=fix_street(my_query.parsed_add.street);
        console.log("my_query="+JSON.stringify(my_query));
        check_table(wT);
    }


})();
