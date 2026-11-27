import { publishedReviews } from "../content/reviews";
import { Icon } from "./icon";
import { ReviewForm } from "./review-form";

export function ReviewsSection() {
  return (
    <section
      className="section reviews-section client-reviews"
      id="reviews"
      aria-labelledby="reviews-heading"
    >
      <div className="container">
        <div className="section-heading">
          <div>
            <p className="eyebrow">CLIENT EXPERIENCES</p>
            <h2 id="reviews-heading">
              Your experience.
              <br />
              In your words.
            </h2>
          </div>
          <p>
            Have you worked with our practice? Share what the experience was like. We welcome honest
            feedback, whatever your rating.
          </p>
        </div>
        {publishedReviews.length ? (
          <>
            <p className="review-publication-note">
              These reviews are shared with the author’s permission and reviewed before publication.
              They describe individual experiences, not promised results.
            </p>
            <div className="reviews-grid">
              {publishedReviews.map((review) => (
                <figure className="review-card" key={review.id}>
                  <Icon name="quote" />
                  <p
                    className="published-review-rating"
                    aria-label={`${review.rating} out of 5 stars`}
                  >
                    <span aria-hidden="true">
                      {"★".repeat(review.rating)}
                      {"☆".repeat(5 - review.rating)}
                    </span>
                  </p>
                  <blockquote>{review.text}</blockquote>
                  <figcaption>
                    <span>
                      {review.displayName}
                      <small>Shared with permission</small>
                    </span>
                  </figcaption>
                </figure>
              ))}
            </div>
          </>
        ) : (
          <div className="reviews-empty">
            <span className="reviews-empty-icon" aria-hidden="true">
              <Icon name="quote" />
            </span>
            <div>
              <h3>A space for real experiences.</h3>
              <p>
                Client reviews will appear here once we have permission to share them. You can leave
                a review below or send feedback privately.
              </p>
            </div>
          </div>
        )}
        <details className="review-disclosure" id="write-review">
          <summary>
            Write a review <Icon name="arrow-right" />
          </summary>
          <div className="review-form-panel">
            <ReviewForm />
          </div>
        </details>
        <p className="review-publication-note">
          Your review goes to the office first. We check authenticity and privacy before publishing,
          and only publish with your permission. To change or withdraw permission, contact the
          office.
        </p>
      </div>
    </section>
  );
}
