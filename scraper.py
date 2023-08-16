import requests
from colorama import Fore
from bs4 import BeautifulSoup
from colorama import init as colorama_init
colorama_init()


# URLs for all content.
ALL_URLS = {
    "data_urls" : {
        "5G" : "https://www.mtn.ng/5g/",
        "data_plans" : "https://www.mtn.ng/data/data-plans/",
        "router_plans" : "https://www.mtn.ng/broadband/router-plans/",
        "fiber_plans" : "https://www.mtn.ng/broadband/fibre-plans/",
        "data_gifting" : "https://www.mtn.ng/data/data-gifting/",
        "sm_bundles" : "https://www.mtn.ng/data/goodybag-social/",
        "video_streaming_package" : "https://www.mtn.ng/personal/youtube-video-streaming-pack/",
    },
    
    "devices" : {
        "broadband_overview" : "https://www.mtn.ng/broadband/",
        "broadband_one_account" : "https://www.mtn.ng/broadband/one-account/",
        "broadband_how_to_guide" : "https://www.mtn.ng/broadband/how-to-guide/",
        "volte" : "https://www.mtn.ng/volte/",
        "device_financing" : "https://www.mtn.ng/device-financing/"
    },

    "voice" : {
        "beta_talk" : "https://www.mtn.ng/personal/betatalk/",
        "m_pulse" : "https://www.mtn.ng/personal/mpulse/",
        "post_paid" : "https://www.mtn.ng/personal/xtraspecial-postpaid/",
        "yafun_yafun" : "https://www.mtn.ng/personal/yafunyafun/",
        "true_talk" : "https://www.mtn.ng/personal/trutalk/",
        "xtra_value" : "https://www.mtn.ng/personal/xtravalue/",
        "int_calls_sms_rate" : "https://www.mtn.ng/personal/international-rates/",
        "international_roaming" : "https://www.mtn.ng/personal/roaming/",
    }
}


def get_mobile_bundle_info(url:str) -> str:
    """
    This function scrapes all data regarding mobile bundles on the MTN website and returns them as a string.   

    Input:
        url:str => URL for MTN Mobile Plans page (Under Data).
    Output:
        info:str => String containing all info of all mobile plan options including bundle, price and how to purchase
    """

    
    mobile_data_info = """""" # String containing combination of all data bundles info

    try:
        response = requests.get(url)
        soup = BeautifulSoup(response.content) # Getting HTML response.
        mobile_plan_cards = soup.find_all("a", {"class" : "_card-deal prepaid-deal"}) # Selection mobile bundle packages card.

        for mobile_plan_detail in mobile_plan_cards:
            plan = mobile_plan_detail.find("h3", {"class" : "_card-deal__title"}).text.strip() # Extracting data plan
            price = (str(mobile_plan_detail.find("span", {"class" : "_card-deal__price-currency"}).text.strip()) + 
            str(mobile_plan_detail.find("span", {"class" : "_card-deal__price-amount"}).text.strip())) # Extracting plan price
            other_info = mobile_plan_detail.find_all("li", {"class" : "deal-feature"})
            other_info_combined = """""" # Extracting info about plan validity period, how to purchase...
            for info in other_info:
                other_info_combined += info.text.strip()+" "

            mobile_data_info += f"{plan} cost {price}, {other_info_combined.strip()}. "

        return mobile_data_info

    except Exception as e:
        print(f"{Fore.RED}Error encountered with get_mobile_bundle_info(): \n{Fore.MAGENTA}{e}")
