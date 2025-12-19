// Contact.jsx
function Contact() {
  return (
    <section className="py-5">
      <div className="container">
        <h2>Contact Us</h2>
        <form>
          <input type="text" className="form-control mb-3" placeholder="Name" />
          <input type="email" className="form-control mb-3" placeholder="Email" />
          <textarea className="form-control mb-3" placeholder="Message"></textarea>
          <button className="btn btn-primary">Send</button>
        </form>
      </div>
    </section>
  );
}

export default Contact;