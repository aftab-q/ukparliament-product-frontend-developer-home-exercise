/**
 * Initializes the member component by fetching member details
 * and updating the relevant DOM elements dynamically.
 */
export async function initMemberComponent(): Promise<void> {
  // Define expected API response structure for type safety
  interface Member {
    nameDisplayAs: string;
    thumbnailUrl: string;
    latestParty?: { name: string; backgroundColour: string };
    latestHouseMembership?: { membershipFrom: string; membershipEndDate?: string };
  }

  // Find the member card element in the DOM
  const card = document.getElementById("mp-card");

  // Extract the member ID from the URL query parameters
  const params = new URLSearchParams(window.location.search);
  const memberId = params.get("id");

  // Exit early and hide card if member ID is missing or card is not found
  if (!memberId || !card) {
    if (card) card.style.display = "none";
    console.warn("No member ID provided or card element not found");
    return;
  }

  // Construct the member-specific API URL
  const apiUrl = `https://members-api.parliament.uk/api/members/${memberId}`;

  // Set up an AbortController for potential request cancellation
  const controller = new AbortController();
  const signal = controller.signal;

  try {
    // Perform the fetch request with abort signal
    const response = await fetch(apiUrl, { signal });

    // Check for unsuccessful response status
    if (!response.ok) {
      console.error(`Fetch failed with status: ${response.status}`);
      card.style.display = "none"; // Hide card on error
      return;
    }

    // Parse the JSON response, extracting the member data
    const responseData: { value: Member } = await response.json();
    const member = responseData.value;

    // Select child elements for updating member information
    const img = card.querySelector(".mp-card__image") as HTMLImageElement | null;
    const party = card.querySelector(".mp-card__party") as HTMLElement | null;
    const name = card.querySelector(".mp-card__name") as HTMLElement | null;
    const constituency = card.querySelector(".mp-card__constituency") as HTMLElement | null;
    const status = card.querySelector(".mp-card__status") as HTMLElement | null;

    // Apply the party color as a CSS custom property, only if available
    const partyColor = member.latestParty?.backgroundColour;
    if (partyColor) {
      const formattedColor = partyColor.startsWith("#") ? partyColor : `#${partyColor}`;
      document.documentElement.style.setProperty("--party-color", formattedColor);
    }

    // Update DOM elements with member data, using fallbacks where needed
    if (img) img.src = member.thumbnailUrl ?? "";
    if (party) party.textContent = member.latestParty?.name ?? "N/A";
    if (name) name.textContent = member.nameDisplayAs ?? "N/A";
    if (constituency) constituency.textContent = member.latestHouseMembership?.membershipFrom ?? "N/A";

    // Determine if the membership is currently active
    const membershipEnd = member.latestHouseMembership?.membershipEndDate;
    const isMembershipActive = membershipEnd ? new Date(membershipEnd) > new Date() : true;

    // Show or hide the status message based on membership activity
    if (status) {
      status.style.display = isMembershipActive ? "none" : "block";
      status.textContent = isMembershipActive ? "" : "No longer serving";
    }

    // Ensure the card is visible once populated
    card.style.display = "block";
  } catch (error) {
    // Hide card on unexpected fetch failure
    if (card) card.style.display = "none";

    // Handle fetch being aborted or other unexpected errors
    if (error instanceof DOMException && error.name === "AbortError") {
      console.warn("Fetch request was aborted");
    } else {
      console.error(`Error fetching data for member ID ${memberId}:`, error);
    }
  }
}
