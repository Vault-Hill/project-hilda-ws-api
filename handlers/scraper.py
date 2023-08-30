import requests
import jsonlines
from colorama import Fore
from bs4 import BeautifulSoup
from colorama import init as colorama_init
colorama_init()


# URLs for all content.
ALL_URLS = {
    "data_urls":
    {
        "5G" : "https://www.mtn.ng/5g/",
        "data_plans" : "https://www.mtn.ng/data/data-plans/",
        "router_plans" : "https://www.mtn.ng/broadband/router-plans/",
        "fiber_plans" : "https://www.mtn.ng/broadband/fibre-plans/",
        "data_gifting" : "https://www.mtn.ng/data/data-gifting/",
        "sm_bundles" : "https://www.mtn.ng/data/goodybag-social/",
        "video_streaming_package" : "https://www.mtn.ng/personal/youtube-video-streaming-pack/",
    },
    "devices":
    {
        "broadband_overview" : "https://www.mtn.ng/broadband/",
        "broadband_one_account" : "https://www.mtn.ng/broadband/one-account/",
        "broadband_how_to_guide" : "https://www.mtn.ng/broadband/how-to-guide/",
        "volte" : "https://www.mtn.ng/volte/",
        "device_financing" : "https://www.mtn.ng/device-financing/"
    },
    "voice":
    {
        "beta_talk" : "https://www.mtn.ng/personal/betatalk/",
        "m_pulse" : "https://www.mtn.ng/personal/mpulse/",
        "post_paid" : "https://www.mtn.ng/personal/xtraspecial-postpaid/",
        "yafun_yafun" : "https://www.mtn.ng/personal/yafunyafun/",
        "true_talk" : "https://www.mtn.ng/personal/trutalk/",
        "xtra_value" : "https://www.mtn.ng/personal/xtravalue/",
        "int_calls_sms_rate" : "https://www.mtn.ng/personal/international-rates/",
        "international_roaming" : "https://www.mtn.ng/personal/roaming/",
    },
    "FAQs":
    {
        "data_gifting" : "https://www.mtn.ng/helppersonal/data-gifting/",
        "data_bundles" : "https://www.mtn.ng/helppersonal/data-bundles/",
        "always_on_data" : "https://www.mtn.ng/helppersonal/always-on-data/",
        "hourly_bundle" : "https://www.mtn.ng/helppersonal/hourly-bundle/",
        "family_pack_bundles" : "https://www.mtn.ng/helppersonal/family-pack-bundles/",
        "goodbag_social" : "https://www.mtn.ng/helppersonal/goodybag-social/",
        "data_referral" : "https://www.mtn.ng/helppersonal/data-referral/",
        "youtube_pack" : "https://www.mtn.ng/helppersonal/youtube-video-streaming-pack/",
        "4G_LTE" : "https://www.mtn.ng/helppersonal/4g/",
        "router_plans" : "https://www.mtn.ng/helppersonal/router-plans/",
        "xtravalue_more" : "https://www.mtn.ng/helppersonal/xtravalue-more/",
        "startimes_on" : "https://www.mtn.ng/helppersonal/startimes-on/"
    },
    "leadership":
    {
        "executive_bod" : "https://www.mtn.ng/leadership/?tablink=executive", # Info about executives and BOD can be found here.
    }
}


# Error message in event of empty responses.
error_message = "URLIssue: Please check that you provided the right URL to the function.\nIf the issue persiste then it means MTN has made changes to their website structure."

def get_bundle_type_info(url:str) -> str:
    """
    This function scrapes all data regarding mobile bundles on the MTN website and returns them as a string.   

    Input:
        url:str => URL for MTN Mobile Plans page (Under Data).
    Output:
        mobile_data_info:str => String containing all info of all mobile plan options including bundle, price and how to purchase
    """

    
    data_info = """""" # String containing combination of all data bundles info

    try:
        response = requests.get(url)
        soup = BeautifulSoup(response.content, features="lxml") # Getting HTML response.
        data_plan_cards = soup.find_all("a", {"class" : "_card-deal prepaid-deal"}) # Selection data bundle packages card.

        for plan_detail in data_plan_cards:
            plan = plan_detail.find("h3", {"class" : "_card-deal__title"}).text.strip() # Extracting data plan
            price = (str(plan_detail.find("span", {"class" : "_card-deal__price-currency"}).text.strip()) + 
            str(plan_detail.find("span", {"class" : "_card-deal__price-amount"}).text.strip())) # Extracting plan price
            other_info = plan_detail.find_all("li", {"class" : "deal-feature"})
            other_info_combined = """""" # Extracting info about plan validity period, how to purchase...
            for info in other_info:
                other_info_combined += info.text.strip()+" "

            data_info += f"{plan} cost {price}, {other_info_combined.strip()}. "

            # Raising exception in event of empty string.
            if len(data_plan_cards) == 0:
                raise Exception(error_message)
            else:
                return data_info

    except Exception as e:
        print(f"{Fore.RED}Error encountered with get_bundle_type_info(): \n{Fore.MAGENTA}{e}")


def data_gifting_info(url:str) -> str:
    """
    This function scrapes all data (FAQs excluded) on the data gifting page

    Input:
        url:str => URL for MTN Data Gifting page (Under Data).
    Output:
        info:str => String containing all info of all data gifting page (FAQs excluded)
    """

    try:
        response = requests.get(url)
        soup = BeautifulSoup(response.content, features="lxml")

        all_gifting_info = "" # String containing gifting info and FAQs.
        data_gifting_info = soup.find_all("div", {"class" : "mtn-body-text mtn-section paragraph"})

        # Extracting info on gifting landing page
        for content in data_gifting_info:
            all_gifting_info += content.text.replace("\n", " ").strip()

        # Raising exception in event of empty string.
        if len(all_gifting_info) == 0:
            raise Exception(error_message)
        else:
            return all_gifting_info
    except Exception as e:
        print(f"{Fore.RED}Error encountered with data_gifting_info(): \n{Fore.MAGENTA}{e}")


def get_FAQs(url:str) -> (list, list):
    """
    This function takes in the URL to the particular FAQs page and returns a tule containing   
    two lists One containing all FAQs and the other containing all responses to the FAQs.
    
    Input:
        url:str => URL for MTN Data Gifting page (Under Data).
    Output:
        FAQs_list:list => List containing all FAQs for service link provided.
        FAQs_answers:list => List containing all responses to FAQs.
    """
    try:
        response = requests.get(url)
        soup = BeautifulSoup(response.content, features="lxml")

        FAQs_list = [] # List of FAQs under topic link provided.
        FAQs_answers = [] # List of answers for each FAQ.

        FAQs = soup.find_all("span", {"class" : "accordion-title"})
        responses = soup.find_all("div", {"class" : "panel"})

        for question, response in zip(FAQs, responses):
            FAQs_list.append(question.text.strip())
            FAQs_answers.append(response.text.strip())

        # Raise exception if lists are empty, meaning URL has an issue.
        if len(FAQs_list) | len(FAQs_answers) == 0:
            raise Exception(error_message)
        else:
            return(FAQs_list, FAQs_answers)
        
    except Exception as e:
        print(f"{Fore.RED}Error encountered with get_FAQs(): \n{Fore.MAGENTA}{e}")


def get_executive_committee(url:str):
    """
    This function gets details about each member of the executive arm of MTN
    Input:
        url:str => URL for MTN Mobile Plans page (Under Data).
    Output:
        returns jsonl file containing questions and answers regarding execttives in MTN.
    """
    file_name = "output.jsonl" # storage name for jsonl dataset.
    response = requests.get(url)
    soup = BeautifulSoup(response.content, features="lxml")

    position_name_dict = {} # Dictionary containing names and positions
    names = [name.text for name in soup.find_all("h5")] # Extracting names of officers from the MTN website
    positions = [position.text for position in soup.find_all("div", {"class" : "leader-designation"})] # Extracting offices/positions.

    # Checking for multiple individuals with same role and formating data accordingly
    for name, position in zip(names, positions):
        if position_name_dict.get(position) == None: # Checking if the role exists in the dataset already
            position_name_dict[position] = [name] # Creating list of names for a particular position if it doesn't exist
        else:
            position_name_dict[position].append(name) # Adding new name to list of already existing names for that position. 


    # Generating questions responses bearing in mind that certain positions have multiple individuals. 
    for position in position_name_dict.keys():
        if len(position_name_dict[position]) == 1: # Position held by only one person.
            name = position_name_dict[position][0] # Extracting name of officer from dictionary
            # Generating questions.
            question_1 = f"Who is the {position} of MTN?"
            question_2 = f"MTNs {position} is called?"
            question_3 = f"What is the name of MTNs {position}"

            # Generating responses to questions.
            response_1 = f"The current {position} of MTN is {name}"
            response_2 = f"The current {position} of MTN is called {name}"
            response_3 = f"The name of the current {position} of MTN is {name}"

            # Creating data template for Json
            data_1 = {
                "prompt" : f"question: {question_1}",
                "completion" : response_1
            }
            data_2 = {
                "prompt" : f"question: {question_2}",
                "completion" : response_2
            }
            data_3 = {
                "prompt" : f"question: {question_3}",
                "completion" : response_3
            }
            # Saving data into Json. Jsonl format
            with jsonlines.open(file_name, mode='a') as writer:
              writer.write(data_1)
            with jsonlines.open(file_name, mode='a') as writer:
                writer.write(data_2)
            with jsonlines.open(file_name, mode='a') as writer:
                writer.write(data_3)
        else: # Handling positions that have multiple individuals.
            position_names = ", ".join(position_name_dict[position]) # Converting individual names into a string
            num_in_position = len(position_name_dict[position]) # Number of people currently holding the position.

            question_1 = f"Who is the {position} of MTN?"
            question_2 = f"MTNs {position} is called?"
            question_3 = f"What is the name of MTNs {position}"
            question_4 = f"Who are the {position}s of MTN?"
            question_5 = f"MTNs {position}s are called?"
            question_6 = f"What are the name of MTNs {position}s"

            # Generating responses to questions.
            response_1 = f"The current {position}s of MTN are {position_names}"
            response_2 = f"Current, there are {num_in_position} {position}s {position_names}"
            response_3 = f"The names of the current {position}s of MTN are {position_names}"
            response_4 = f"The current {position}s of MTN are {position_names}"
            response_5 = f"Current, there are {num_in_position} {position}s {position_names}"
            response_6 = f"The names of the {num_in_position} {position}s of MTN are {position_names}"

            # Creating data template for Json
            data_1 = {
                "prompt" : f"question: {question_1}",
                "completion" : response_1
            }
            data_2 = {
                "prompt" : f"question: {question_2}",
                "completion" : response_2
            }
            data_3 = {
                "prompt" : f"question: {question_3}",
                "completion" : response_3
            }
            data_4 = {
                "prompt" : f"question: {question_4}",
                "completion" : response_4
            }
            data_5 = {
                "prompt" : f"question: {question_5}",
                "completion" : response_5
            }
            data_6 = {
                "prompt" : f"question: {question_6}",
                "completion" : response_6
            }
            # Saving data into Json. Jsonl format.
            with jsonlines.open(file_name, mode='a') as writer:
              writer.write(data_1)
            with jsonlines.open(file_name, mode='a') as writer:
                writer.write(data_2)
            with jsonlines.open(file_name, mode='a') as writer:
                writer.write(data_3)
            with jsonlines.open(file_name, mode='a') as writer:
              writer.write(data_4)
            with jsonlines.open(file_name, mode='a') as writer:
                writer.write(data_5)
            with jsonlines.open(file_name, mode='a') as writer:
                writer.write(data_6)

    if len(names) | len(positions) == 0: # Checking if any data was succesfully scraped.
        print(f"{Fore.RED}Error encountered with get_executive_committee():\n{Fore.MAGENTA}Check that the url provided is correct, if error persists then MTN has made changes to their website")
    else:
        # Confirmation message.
        print(f"Data saved as .jsonl in '{file_name}'")


get_executive_committee(ALL_URLS["leadership"]["executive_bod"])
# response = data_gifting_info("https://www.google.com")
# print(response)