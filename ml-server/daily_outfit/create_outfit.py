#use a prompt:sort embeddings using the style for a specific wheather condition
#users preferences of style tags
#other preferences such as: silhoutte, what they prefer for the bottoms such as skirts/ shorts/ pants/ jeans
#integer values: how okay are the users with trying something outside of their preferences
#how likely are they to wear something that doesnt perfectly match what they want -> look at the upload image route
#based on their confidence level
#include edge cases where the users do not have everything needed

#import fine tuned fashion clip

#make an instance of it

#use the fine-tuned version of fashion clip to create outfits based on style that its asked for

#depending on the wheather API tags returned, we will return the best item for each category

from daily_outfit.sortingOutfits import group_by_type


def _top_score(item):
    scores = item.get("style_scores", [])
    return scores[0]["score"] if scores else 0.0


def _sorted_by_score(items):
    return sorted(items, key=_top_score, reverse=True)


def pick_first_best(items, used_ids):
    """Pick the highest-confidence item not already used (first outfit slot)."""
    for item in items:
        if item["_id"] not in used_ids:
            return item
    return None


def pick_second_best(items, used_ids):
    """Pick the highest-confidence item not already used (second outfit slot)."""
    for item in items:
        if item["_id"] not in used_ids:
            return item
    return None


def pick_third_best(items, used_ids):
    """Pick the highest-confidence item not already used (third outfit slot)."""
    for item in items:
        if item["_id"] not in used_ids:
            return item
    return None


def assemble_outfits(filtered_closet):
    """
    Build up to 3 outfits from the weather- and style-filtered closet.
    Each outfit requires at minimum: (top + bottom + footwear) OR (one-piece + footwear).
    No item is reused across outfits.

    Returns a dictionary with keys "first", "second", "third"; value is an outfit dict or null.
    """

    #step 1: sort the items in the closet by their confidence score in similarity to the users preferences
    sorted_groups = {cat: _sorted_by_score(items) for cat, items in filtered_closet.items()}

    #step 2: create a set so that we can track which items have already been placed in an outfit
    #step 3 : pair up 3 outfit slots using the three picker functions i defined above
    used_ids = set()
    pickers = [pick_first_best, pick_second_best, pick_third_best]
    outfit_keys = ["first", "second", "third"]
    result = {"first": None, "second": None, "third": None}

    #step 4: loop to grab ranked items in order all while skipping anything already in used_ids.
    for key, picker in zip(outfit_keys, pickers):
        top = picker(sorted_groups["top"], used_ids)
        bottom = picker(sorted_groups["bottom"], used_ids)
        footwear = picker(sorted_groups["footwear"], used_ids)
        onepiece = picker(sorted_groups["one-piece"], used_ids)

        #step 5: build each outfit using the following logic: 
        '''
        For each of the three slots, it tries to pick a top, bottom, footwear, and one-piece using that slot's picker. Then it checks which combo works:

        If it found a top and bottom and footwear - build a standard outfit
        Else if it found a one-piece and footwear - build a one-piece outfit
        Else stop entirely, because there aren't enough items left for a valid outfit. The remaining slots stay null. 
        '''
        if top and bottom and footwear:
            outfit = {
                "top": top["_id"],
                "bottom": bottom["_id"],
                "footwear": footwear["_id"],
            }
            used_ids.update([top["_id"], bottom["_id"], footwear["_id"]])
        elif onepiece and footwear:
            outfit = {
                "top": onepiece["_id"],
                "bottom": None,
                "footwear": footwear["_id"],
            }
            used_ids.update([onepiece["_id"], footwear["_id"]])
        else:
            break  # not enough items for a valid outfit; remaining slots stay null ?? #TODO: ask maria if we should return what we have

        outerwear = picker(sorted_groups["outerwear"], used_ids)
        accessory = picker(sorted_groups["accessories"], used_ids)

        outfit["outerwear"] = outerwear["_id"] if outerwear else None
        outfit["accessories"] = accessory["_id"] if accessory else None

        if outerwear:
            used_ids.add(outerwear["_id"])
        if accessory:
            used_ids.add(accessory["_id"])

        result[key] = outfit

    return result
