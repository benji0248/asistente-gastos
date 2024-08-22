import { useEffect, useState } from "react";
import { Container } from "react-bootstrap"
import { User } from "../../types";
import { DocumentData, onSnapshot, QuerySnapshot } from "firebase/firestore";
import { userCollection } from "../../lib/controller";


function Profile() {
    
    const [user, setUser] = useState<User[]>([]);

  useEffect(() =>
    onSnapshot(userCollection, (snapshot: QuerySnapshot<DocumentData, DocumentData>) => {
      setUser(
        snapshot.docs.map((doc) => {
          return {
            id: doc.id,
            ...doc.data(),
          } as User;
        })
      );
    }), []
  );

    return (
        <Container>
            <h1></h1>
        </Container>
    )
}

export default Profile